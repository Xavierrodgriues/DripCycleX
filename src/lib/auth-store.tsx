import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { broadcastSync } from "@/lib/sync-channel";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  registeredAt: string;
  status: "active" | "suspended";
}

export interface StoredUserCredential {
  email: string;
  phone: string;
  password: string;
  userId: string;
}

export interface UserCartRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  productName: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  lastActive: string;
}

export interface UserWishlistRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  dateAdded: string;
}

interface AuthContextType {
  currentUser: CustomerUser | null;
  users: CustomerUser[];
  register: (
    data: Omit<CustomerUser, "id" | "registeredAt" | "status">,
    password: string,
  ) => Promise<boolean>;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<CustomerUser>) => Promise<void>;
  syncCartToAdmin: (
    cart: { name: string; size: string; color: string; qty: number; price: number }[],
  ) => void;
  syncWishlistToAdmin: (
    productSlugs: string[],
    allProducts: { id: string; slug: string; name: string; category: string; price: number }[],
  ) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "dripcyclex.users";
const PASSWORDS_KEY = "dripcyclex.user_passwords";
const CURRENT_USER_KEY = "dripcyclex.currentUser";
const CARTS_KEY = "dripcyclex.admin.carts";
const WISHLISTS_KEY = "dripcyclex.admin.wishlists";

interface ShippingAddressShape {
  address_line1?: string | undefined;
  address_line2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postal_code?: string | undefined;
  country?: string | undefined;
}

interface UserMetadataShape {
  id?: string | undefined;
  email?: string | undefined;
  full_name?: string | undefined;
  name?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  postal_code?: string | undefined;
  shipping_address?: ShippingAddressShape | undefined;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  shipping_address: ShippingAddressShape | null;
  created_at: string;
  updated_at: string;
}

function mapProfileToCustomer(
  profile: Partial<ProfileRow>,
  fallbackMeta?: UserMetadataShape,
): CustomerUser {
  const shipping = profile.shipping_address ?? fallbackMeta?.shipping_address;
  return {
    id: profile.id ?? fallbackMeta?.id ?? `usr-${Date.now()}`,
    name: profile.full_name ?? fallbackMeta?.full_name ?? fallbackMeta?.name ?? "Customer",
    email: profile.email ?? fallbackMeta?.email ?? "",
    phone: profile.phone ?? fallbackMeta?.phone ?? "",
    address: shipping?.address_line1 ?? fallbackMeta?.address ?? "",
    city: shipping?.city ?? fallbackMeta?.city ?? "",
    state: shipping?.state ?? fallbackMeta?.state ?? "State",
    zipCode: shipping?.postal_code ?? fallbackMeta?.zipCode ?? "",
    registeredAt: profile.created_at
      ? profile.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    status: profile.role === "suspended" ? "suspended" : "active",
  };
}

async function fetchAndSyncProfile(supabaseUser: SupabaseUser): Promise<CustomerUser> {
  const meta: UserMetadataShape = (supabaseUser.user_metadata ?? {}) as UserMetadataShape;

  // 1. Try to fetch from public.profiles
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .maybeSingle();

    if (profile) {
      return mapProfileToCustomer(profile as ProfileRow, {
        ...meta,
        id: supabaseUser.id,
        email: supabaseUser.email,
      });
    }
  } catch (err: unknown) {
    console.warn("Could not query profiles from Supabase:", err);
  }

  // 2. If profile record does not exist in profiles table yet, create/upsert it
  const shipping: ShippingAddressShape = meta.shipping_address ?? {
    address_line1: meta.address ?? "",
    address_line2: "",
    city: meta.city ?? "",
    state: meta.state ?? "State",
    postal_code: meta.zipCode ?? "",
    country: "India",
  };

  const newProfile = {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    full_name: meta.full_name ?? meta.name ?? "",
    phone: meta.phone ?? "",
    role: "customer",
    shipping_address: shipping,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: inserted } = await supabase
      .from("profiles")
      .upsert(newProfile)
      .select()
      .maybeSingle();

    if (inserted) {
      return mapProfileToCustomer(inserted as ProfileRow, {
        ...meta,
        id: supabaseUser.id,
        email: supabaseUser.email,
      });
    }
  } catch (err: unknown) {
    console.warn("Could not upsert profile directly:", err);
  }

  return mapProfileToCustomer(newProfile, {
    ...meta,
    id: supabaseUser.id,
    email: supabaseUser.email,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<CustomerUser[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  // Sync currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  // Supabase Auth listener & Session Hydration
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSyncProfile(session.user).then((cUser) => {
          setCurrentUser(cUser);
          setUsers((prev) => [cUser, ...prev.filter((u) => u.id !== cUser.id)]);
        });
      }
    });

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        const cUser = await fetchAndSyncProfile(session.user);
        setCurrentUser(cUser);
        setUsers((prev) => [cUser, ...prev.filter((u) => u.id !== cUser.id)]);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    // 3. Hydrate remote profiles from Supabase into users list
    const loadRemoteProfiles = async () => {
      try {
        const { data: remoteProfiles } = await supabase.from("profiles").select("*");
        if (remoteProfiles && remoteProfiles.length > 0) {
          const mapped = remoteProfiles.map((p: ProfileRow) => mapProfileToCustomer(p));
          setUsers((prev) => {
            const map = new Map<string, CustomerUser>();
            mapped.forEach((u) => map.set(u.id, u));
            prev.forEach((u) => {
              if (!map.has(u.id)) map.set(u.id, u);
            });
            return Array.from(map.values());
          });
        }
      } catch (err: unknown) {
        console.warn("Remote profiles sync warning:", err);
      }
    };
    void loadRemoteProfiles();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Register a new customer
  const register = useCallback(
    async (
      userData: Omit<CustomerUser, "id" | "registeredAt" | "status">,
      password: string,
    ): Promise<boolean> => {
      try {
        const cleanEmail = userData.email.toLowerCase().trim();
        const cleanPhone = userData.phone.trim();

        if (isSupabaseConfigured) {
          // 1. Supabase Auth signup
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: userData.name,
                name: userData.name,
                phone: cleanPhone,
                address: userData.address,
                city: userData.city,
                state: userData.state,
                zipCode: userData.zipCode,
                shipping_address: {
                  address_line1: userData.address,
                  address_line2: "",
                  city: userData.city,
                  state: userData.state,
                  postal_code: userData.zipCode,
                  country: "India",
                },
              },
            },
          });

          if (authError) {
            toast.error("Registration Failed", {
              description: authError.message,
            });
            return false;
          }

          const sbUser = authData.user;
          if (!sbUser) {
            toast.error("Registration Incomplete", {
              description: "No user returned from authentication service.",
            });
            return false;
          }

          // 2. Ensure profile is stored in public.profiles table
          const profileRecord = {
            id: sbUser.id,
            email: cleanEmail,
            full_name: userData.name,
            phone: cleanPhone,
            role: "customer",
            shipping_address: {
              address_line1: userData.address,
              address_line2: "",
              city: userData.city,
              state: userData.state,
              postal_code: userData.zipCode,
              country: "India",
            },
            updated_at: new Date().toISOString(),
          };

          try {
            await supabase.from("profiles").upsert(profileRecord);
          } catch (dbErr: unknown) {
            console.warn("Direct profiles upsert notice:", dbErr);
          }

          const newUser: CustomerUser = {
            ...userData,
            id: sbUser.id,
            registeredAt: new Date().toISOString().slice(0, 10),
            status: "active",
          };

          setUsers((prev) => [newUser, ...prev.filter((u) => u.email !== cleanEmail)]);
          setCurrentUser(newUser);

          if (!authData.session) {
            toast.success("Account Registered!", {
              description: `Verification email sent to ${cleanEmail}. Please verify or sign in.`,
            });
          } else {
            toast.success("Welcome to DRIPCYCLEX", {
              description: `Account created for ${newUser.name}. You are signed in.`,
            });
          }

          broadcastSync("USER_REGISTERED", { user: newUser });
          return true;
        }

        // Offline / LocalStorage Fallback (if Supabase not configured)
        const passwords: StoredUserCredential[] = JSON.parse(
          localStorage.getItem(PASSWORDS_KEY) || "[]",
        );

        const existing = users.find(
          (u) => u.email.toLowerCase() === cleanEmail || u.phone.trim() === cleanPhone,
        );

        if (existing) {
          toast.error("Account Exists", {
            description: "A customer with this email or phone number is already registered.",
          });
          return false;
        }

        const newId = `usr-${Date.now().toString().slice(-6)}`;
        const newUser: CustomerUser = {
          ...userData,
          id: newId,
          registeredAt: new Date().toISOString().slice(0, 10),
          status: "active",
        };

        const updatedUsers = [newUser, ...users];
        setUsers(updatedUsers);
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

        passwords.push({
          email: cleanEmail,
          phone: cleanPhone,
          password,
          userId: newId,
        });
        localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));

        setCurrentUser(newUser);
        broadcastSync("USER_REGISTERED", { user: newUser });
        toast.success("Welcome to DRIPCYCLEX", {
          description: `Account created for ${newUser.name}. You are signed in.`,
        });
        return true;
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Please check your details and try again.";
        toast.error("Registration Failed", {
          description: msg,
        });
        return false;
      }
    },
    [users],
  );

  // Login
  const login = useCallback(
    async (emailOrPhone: string, password: string): Promise<boolean> => {
      try {
        const cleanInput = emailOrPhone.trim();
        let emailToAuth = cleanInput.toLowerCase();

        if (isSupabaseConfigured) {
          // If input is phone number without '@', look up corresponding email in profiles
          if (!cleanInput.includes("@")) {
            try {
              const { data: foundProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("phone", cleanInput)
                .maybeSingle();

              if (foundProfile && typeof foundProfile === "object" && "email" in foundProfile) {
                const pEmail = (foundProfile as { email?: string }).email;
                if (pEmail) emailToAuth = pEmail.toLowerCase();
              } else {
                const localMatch = users.find((u) => u.phone.trim() === cleanInput);
                if (localMatch?.email) emailToAuth = localMatch.email.toLowerCase();
              }
            } catch (e: unknown) {
              console.warn("Phone lookup warning:", e);
            }
          }

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToAuth,
            password,
          });

          if (authError) {
            // Check offline/local credentials fallback
            const passwords: StoredUserCredential[] = JSON.parse(
              localStorage.getItem(PASSWORDS_KEY) || "[]",
            );
            const matchedCred = passwords.find(
              (c) =>
                (c.email === cleanInput.toLowerCase() || c.phone === cleanInput) &&
                c.password === password,
            );

            if (matchedCred) {
              const foundUser = users.find((u) => u.id === matchedCred.userId);
              if (foundUser && foundUser.status !== "suspended") {
                setCurrentUser(foundUser);
                toast.success("Welcome Back", {
                  description: `Signed in as ${foundUser.name}.`,
                });
                return true;
              }
            }

            toast.error("Authentication Failed", {
              description: authError.message || "Incorrect email or password.",
            });
            return false;
          }

          if (authData.user) {
            const customerUser = await fetchAndSyncProfile(authData.user);
            if (customerUser.status === "suspended") {
              await supabase.auth.signOut();
              toast.error("Account Suspended", {
                description: "Please contact Dripcyclex@gmail.com for assistance.",
              });
              return false;
            }

            setCurrentUser(customerUser);
            setUsers((prev) => [customerUser, ...prev.filter((u) => u.id !== customerUser.id)]);
            toast.success("Welcome Back", {
              description: `Signed in as ${customerUser.name}.`,
            });
            return true;
          }
        }

        // Offline / LocalStorage Fallback
        const passwords: StoredUserCredential[] = JSON.parse(
          localStorage.getItem(PASSWORDS_KEY) || "[]",
        );

        const matchedCred = passwords.find(
          (c) =>
            (c.email === cleanInput.toLowerCase() || c.phone === cleanInput) &&
            c.password === password,
        );

        if (!matchedCred) {
          toast.error("Authentication Failed", {
            description: "Incorrect email, phone number, or password.",
          });
          return false;
        }

        const foundUser = users.find((u) => u.id === matchedCred.userId);
        if (!foundUser) {
          toast.error("User Record Not Found");
          return false;
        }

        if (foundUser.status === "suspended") {
          toast.error("Account Suspended", {
            description: "Please contact Dripcyclex@gmail.com for assistance.",
          });
          return false;
        }

        setCurrentUser(foundUser);
        toast.success("Welcome Back", {
          description: `Signed in as ${foundUser.name}.`,
        });
        return true;
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Please check your details and try again.";
        toast.error("Sign-in Error", {
          description: msg,
        });
        return false;
      }
    },
    [users],
  );

  // Login with Phone OTP
  const loginWithPhoneOtp = useCallback(
    async (phone: string, otp: string): Promise<boolean> => {
      try {
        const { verifyPhoneOtp, normalizePhoneNumber } = await import("@/lib/otp-service");
        const { national } = normalizePhoneNumber(phone);

        // 1. Verify OTP first
        const verification = await verifyPhoneOtp(phone, otp);
        if (!verification.success) {
          toast.error("Verification Failed", {
            description: verification.error || "Invalid OTP code.",
          });
          return false;
        }

        // 2. Find profile by phone
        let userProfile: CustomerUser | null = null;
        if (isSupabaseConfigured) {
          const { data: foundProfiles } = await supabase
            .from("profiles")
            .select("*")
            .or(`phone.eq.${phone},phone.eq.${national},phone.eq.+91${national}`)
            .limit(1);

          if (foundProfiles && foundProfiles.length > 0 && foundProfiles[0]) {
            userProfile = mapProfileToCustomer(foundProfiles[0] as ProfileRow);
          }
        }

        // 3. Fallback to local users
        if (!userProfile) {
          const localMatch = users.find((u) => {
            const uDigits = u.phone.replace(/\D/g, "");
            return uDigits === national || uDigits.endsWith(national);
          });
          if (localMatch) userProfile = localMatch;
        }

        if (!userProfile) {
          toast.error("Account Not Found", {
            description: "No registered account found with this phone number. Please register first.",
          });
          return false;
        }

        if (userProfile.status === "suspended") {
          toast.error("Account Suspended", {
            description: "Please contact Dripcyclex@gmail.com for assistance.",
          });
          return false;
        }

        setCurrentUser(userProfile);
        setUsers((prev) => [userProfile!, ...prev.filter((u) => u.id !== userProfile!.id)]);
        toast.success("Welcome Back", {
          description: `Signed in via Phone OTP as ${userProfile.name}.`,
        });
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Phone OTP sign-in error";
        toast.error("Sign-in Failed", { description: msg });
        return false;
      }
    },
    [users],
  );

  // Logout
  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e: unknown) {
        console.warn("Sign out notice:", e);
      }
    }
    setCurrentUser(null);
    toast.info("Signed Out", { description: "You have been signed out." });
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (data: Partial<CustomerUser>) => {
      if (!currentUser) return;
      const updated: CustomerUser = { ...currentUser, ...data };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

      if (isSupabaseConfigured && currentUser.id) {
        try {
          await supabase
            .from("profiles")
            .update({
              full_name: updated.name,
              phone: updated.phone,
              shipping_address: {
                address_line1: updated.address,
                address_line2: "",
                city: updated.city,
                state: updated.state,
                postal_code: updated.zipCode,
                country: "India",
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentUser.id);
        } catch (err: unknown) {
          console.warn("Could not sync profile update to Supabase:", err);
        }
      }

      toast.success("Profile Updated", { description: "Your details have been saved." });
    },
    [currentUser],
  );

  // Sync Cart lines to Admin storage
  const syncCartToAdmin = useCallback(
    (cart: { name: string; size: string; color: string; qty: number; price: number }[]) => {
      try {
        const allAdminCarts: UserCartRecord[] = JSON.parse(
          localStorage.getItem(CARTS_KEY) || "[]",
        );

        const activeUser = currentUser || (users.length > 0 ? users[0] : null);
        const userId = activeUser ? activeUser.id : "guest-visitor";
        const userName = activeUser ? activeUser.name : "Active Shopper (Storefront)";
        const userPhone = activeUser ? activeUser.phone : "+91 84697 11940";
        const userEmail = activeUser ? activeUser.email : "shopper@dripcyclex.com";

        const filtered = allAdminCarts.filter((c) => c.userId !== userId);

        const newRecords: UserCartRecord[] = cart.map((line, idx) => ({
          id: `cart-${userId}-${idx}-${line.size}-${line.color}`,
          userId,
          userName,
          userPhone,
          userEmail,
          productName: line.name,
          size: line.size,
          color: line.color,
          qty: line.qty,
          unitPrice: line.price,
          lineTotal: line.qty * line.price,
          lastActive: "Active Now",
        }));

        localStorage.setItem(CARTS_KEY, JSON.stringify([...newRecords, ...filtered]));
      } catch {
        /* ignore */
      }
    },
    [currentUser, users],
  );

  // Sync Wishlist to Admin storage
  const syncWishlistToAdmin = useCallback(
    (
      productSlugs: string[],
      allProducts: { id: string; slug: string; name: string; category: string; price: number }[],
    ) => {
      try {
        const allAdminWishlists: UserWishlistRecord[] = JSON.parse(
          localStorage.getItem(WISHLISTS_KEY) || "[]",
        );

        const activeUser = currentUser || (users.length > 0 ? users[0] : null);
        const userId = activeUser ? activeUser.id : "guest-visitor";
        const userName = activeUser ? activeUser.name : "Active Shopper (Storefront)";
        const userPhone = activeUser ? activeUser.phone : "+91 84697 11940";
        const userEmail = activeUser ? activeUser.email : "shopper@dripcyclex.com";

        const filtered = allAdminWishlists.filter((w) => w.userId !== userId);

        let customProducts: typeof allProducts = [];
        try {
          const rawCustom = localStorage.getItem("dripcyclex.admin.products");
          if (rawCustom) customProducts = JSON.parse(rawCustom);
        } catch {
          /* ignore */
        }
        const fullCatalog = [...allProducts, ...customProducts];

        const newRecords: UserWishlistRecord[] = productSlugs
          .map((slug) => {
            const prod = fullCatalog.find((p) => p.slug === slug || p.id === slug);
            if (!prod) {
              const cleanName = slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return {
                id: `wish-${userId}-${slug}`,
                userId,
                userName,
                userPhone,
                userEmail,
                productId: slug,
                productName: `DRIPCYCLEX ${cleanName}`,
                category: "T-Shirts",
                price: 1799,
                dateAdded: new Date().toISOString().slice(0, 10),
              };
            }
            return {
              id: `wish-${userId}-${slug}`,
              userId,
              userName,
              userPhone,
              userEmail,
              productId: prod.id,
              productName: prod.name,
              category: prod.category,
              price: prod.price,
              dateAdded: new Date().toISOString().slice(0, 10),
            };
          })
          .filter(Boolean) as UserWishlistRecord[];

        localStorage.setItem(WISHLISTS_KEY, JSON.stringify([...newRecords, ...filtered]));
      } catch {
        /* ignore */
      }
    },
    [currentUser, users],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        register,
        login,
        loginWithPhoneOtp,
        logout,
        updateProfile,
        syncCartToAdmin,
        syncWishlistToAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
