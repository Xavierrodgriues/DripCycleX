import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { broadcastSync, useRealtimeSync, type SyncPayload } from "@/lib/sync-channel";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { normalizePhoneNumber } from "@/lib/otp-service";
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
  productImage?: string | undefined;
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
  ) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>;
  verifyEmailOtp: (
    email: string,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resendEmailOtp: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<CustomerUser>) => Promise<void>;
  syncCartToAdmin: (
    cart: { name: string; size: string; color: string; qty: number; price: number; image?: string }[],
  ) => void;
  syncWishlistToAdmin: (
    productSlugs: string[],
    allProducts: { id: string; slug: string; name: string; category: string; price: number }[],
  ) => void;
  setUserStatus: (userId: string, status: "active" | "suspended") => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CARTS_KEY = "dripcyclex.admin.carts";
const WISHLISTS_KEY = "dripcyclex.admin.wishlists";

// Purge any legacy localhost password / user cache from browser on initialization
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("dripcyclex.users");
    localStorage.removeItem("dripcyclex.user_passwords");
    localStorage.removeItem("dripcyclex.passwords");
    localStorage.removeItem("dripcyclex.currentUser");
  } catch {
    /* ignore */
  }
}

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
  role?: string | undefined;
  status?: string | undefined;
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

const SUSPENDED_REGISTRY_KEY = "dripcyclex.suspended_registry";

function getSuspendedRegistry(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUSPENDED_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function updateSuspendedRegistry(userIdOrEmail: string, isSuspended: boolean) {
  if (typeof window === "undefined" || !userIdOrEmail) return;
  try {
    const current = getSuspendedRegistry();
    const clean = userIdOrEmail.toLowerCase().trim();
    let next: string[];
    if (isSuspended) {
      next = Array.from(new Set([...current, clean]));
    } else {
      next = current.filter((id) => id.toLowerCase() !== clean);
    }
    localStorage.setItem(SUSPENDED_REGISTRY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function isUserSuspended(id?: string, email?: string, phone?: string): boolean {
  const reg = getSuspendedRegistry();
  if (reg.length === 0) return false;
  const set = new Set(reg.map((s) => s.toLowerCase().trim()));
  if (id && set.has(id.toLowerCase().trim())) return true;
  if (email && set.has(email.toLowerCase().trim())) return true;
  if (phone) {
    const pDigits = phone.replace(/\D/g, "");
    if (pDigits && (set.has(pDigits) || set.has(pDigits.slice(-10)))) return true;
  }
  return false;
}

function mapProfileToCustomer(
  profile: Partial<ProfileRow>,
  fallbackMeta?: UserMetadataShape,
): CustomerUser {
  const shipping = profile.shipping_address ?? fallbackMeta?.shipping_address;
  const rawId = profile.id ?? fallbackMeta?.id ?? `usr-${Date.now()}`;
  const rawEmail = profile.email ?? fallbackMeta?.email ?? "";
  const rawPhone = profile.phone ?? fallbackMeta?.phone ?? "";

  const isSuspended =
    (profile as any)?.status === "suspended" ||
    profile.role === "suspended" ||
    fallbackMeta?.role === "suspended" ||
    isUserSuspended(rawId, rawEmail, rawPhone);

  return {
    id: rawId,
    name: profile.full_name ?? fallbackMeta?.full_name ?? fallbackMeta?.name ?? "Customer",
    email: rawEmail,
    phone: rawPhone,
    address: shipping?.address_line1 ?? fallbackMeta?.address ?? "",
    city: shipping?.city ?? fallbackMeta?.city ?? "",
    state: shipping?.state ?? fallbackMeta?.state ?? "State",
    zipCode: shipping?.postal_code ?? fallbackMeta?.zipCode ?? "",
    registeredAt: profile.created_at
      ? profile.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    status: isSuspended ? "suspended" : "active",
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
  // Users list is strictly synchronized with Supabase public.profiles
  const [users, setUsers] = useState<CustomerUser[]>([]);

  // Current user is strictly driven by Supabase Auth session
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);

  // Supabase Auth listener & Session Hydration
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Initial Session Check directly from Supabase Auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const cUser = await fetchAndSyncProfile(session.user);
          if (cUser.status === "suspended") {
            await supabase.auth.signOut();
            setCurrentUser(null);
            toast.error("Account Suspended", {
              description: "Your account has been suspended by administration. Access is blocked.",
              duration: 8000,
            });
            return;
          }
          setCurrentUser(cUser);
          setUsers((prev) => [cUser, ...prev.filter((u) => u.id !== cUser.id)]);
        } catch {
          setCurrentUser(null);
        }
      } else {
        // No active session in Supabase (or user was deleted from Supabase)
        setCurrentUser(null);
      }
    });

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        try {
          const cUser = await fetchAndSyncProfile(session.user);
          if (cUser.status === "suspended") {
            await supabase.auth.signOut();
            setCurrentUser(null);
            toast.error("Account Suspended", {
              description: "Your account has been suspended by administration. Access is blocked.",
              duration: 8000,
            });
            return;
          }
          setCurrentUser(cUser);
          setUsers((prev) => [cUser, ...prev.filter((u) => u.id !== cUser.id)]);
        } catch {
          setCurrentUser(null);
        }
      } else if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null);
      }
    });

    // 3. Hydrate remote profiles from Supabase into users list
    const loadRemoteProfiles = async () => {
      try {
        const { data: remoteProfiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (remoteProfiles && remoteProfiles.length > 0) {
          const mapped = remoteProfiles.map((p: ProfileRow) => mapProfileToCustomer(p));
          setUsers(mapped);
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
    ): Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }> => {
      try {
        const cleanEmail = userData.email.toLowerCase().trim();
        const cleanPhone = userData.phone.replace(/\D/g, "").slice(0, 10);

        // Enforce exactly 10 digits without country code or special characters
        if (cleanPhone.length !== 10) {
          toast.error("Invalid Contact Number", {
            description: "Contact number must be strictly 10 digits without country code or special characters.",
          });
          return {
            success: false,
            error: "Contact number must be strictly 10 digits without country code.",
          };
        }

        if (isSupabaseConfigured) {
          // 1. Verify Uniqueness of Email in database
          const { data: existingEmail } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (existingEmail) {
            toast.error("Email Already Registered", {
              description: "An account with this email address already exists. Please sign in instead.",
            });
            return {
              success: false,
              error: "This email address is already registered.",
            };
          }

          // 2. Verify Uniqueness of Contact Number in database
          const { data: existingPhone } = await supabase
            .from("profiles")
            .select("id, phone")
            .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},phone.eq.+91 ${cleanPhone}`)
            .limit(1);

          if (existingPhone && existingPhone.length > 0) {
            toast.error("Contact Number Already Registered", {
              description: "A customer with this 10-digit contact number already exists. Please sign in or use another number.",
            });
            return {
              success: false,
              error: "This contact number is already registered to another account.",
            };
          }

          // 3. Supabase Auth signup (dispatches verification email via custom Resend SMTP no-reply@dripcyclex.in)
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
            const isDuplicate =
              authError.message.toLowerCase().includes("already registered") ||
              authError.message.toLowerCase().includes("already exists");
            const errorDescription = isDuplicate
              ? "This email address is already registered. Please sign in."
              : authError.message;

            toast.error("Registration Failed", {
              description: errorDescription,
            });
            return { success: false, error: errorDescription };
          }

          const sbUser = authData.user;
          if (!sbUser) {
            toast.error("Registration Incomplete", {
              description: "No user returned from authentication service.",
            });
            return { success: false, error: "No user returned." };
          }

          // If email confirmation is enabled and user already exists, Supabase returns empty identities array
          if (sbUser.identities && sbUser.identities.length === 0) {
            toast.error("Email Already Registered", {
              description: "An account with this email address already exists. Please sign in instead.",
            });
            return {
              success: false,
              error: "This email address is already registered.",
            };
          }

          // 2. Ensure profile is stored in public.profiles table
          const profileRecord = {
            id: sbUser.id,
            email: cleanEmail,
            full_name: userData.name,
            phone: cleanPhone,
            role: "customer",
            status: "active",
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

          // If Supabase has email confirmation enabled (!authData.session), customer must verify via OTP or link
          if (!authData.session) {
            toast.info("Verification Code Sent", {
              description: `Confirmation email has been sent to ${cleanEmail} from no-reply@dripcyclex.in.`,
            });
            return { success: true, requiresEmailVerification: true };
          }

          // If session is already active
          setUsers((prev) => [newUser, ...prev.filter((u) => u.email !== cleanEmail)]);
          setCurrentUser(newUser);

          toast.success("Welcome to DRIPCYCLEX", {
            description: `Account created for ${newUser.name}. You are signed in.`,
          });

          broadcastSync("USER_REGISTERED", { user: newUser });
          return { success: true, requiresEmailVerification: false };
        }

        toast.error("Registration Unavailable", {
          description: "Database authentication service is not connected.",
        });
        return { success: false, error: "Database not connected." };
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Please check your details and try again.";
        toast.error("Registration Failed", {
          description: msg,
        });
        return { success: false, error: msg };
      }
    },
    [],
  );

  // Verify Supabase Email OTP for signup confirmation (using Resend SMTP)
  const verifyEmailOtp = useCallback(
    async (
      rawEmail: string,
      token: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = rawEmail.toLowerCase().trim();
      const cleanToken = token.trim();

      if (!cleanToken) {
        return { success: false, error: "Please enter the 6-digit confirmation code." };
      }

      if (!isSupabaseConfigured) {
        return { success: true };
      }

      try {
        // Try type 'signup' first
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "signup",
        });

        if (error) {
          // Fallback to type 'email' in case magic OTP was sent
          const retry = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "email",
          });

          if (retry.error) {
            return { success: false, error: retry.error.message || error.message };
          }

          if (retry.data.user) {
            const customer = await fetchAndSyncProfile(retry.data.user);
            setCurrentUser(customer);
            setUsers((prev) => [customer, ...prev.filter((u) => u.id !== customer.id)]);
            broadcastSync("USER_REGISTERED", { user: customer });
            return { success: true };
          }
        }

        if (data.user) {
          const customer = await fetchAndSyncProfile(data.user);
          setCurrentUser(customer);
          setUsers((prev) => [customer, ...prev.filter((u) => u.id !== customer.id)]);
          broadcastSync("USER_REGISTERED", { user: customer });
          return { success: true };
        }

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Verification failed.";
        return { success: false, error: msg };
      }
    },
    [],
  );

  // Resend Supabase verification email via Resend SMTP
  const resendEmailOtp = useCallback(
    async (rawEmail: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = rawEmail.toLowerCase().trim();
      if (!isSupabaseConfigured) {
        return { success: true };
      }

      try {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: cleanEmail,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        toast.success("Verification Code Resent", {
          description: `A new confirmation email has been dispatched to ${cleanEmail} via no-reply@dripcyclex.in.`,
        });
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to resend confirmation email.";
        return { success: false, error: msg };
      }
    },
    [],
  );

  // Login (strictly authenticated via Supabase Auth — no localhost/localStorage bypass)
  const login = useCallback(
    async (emailOrPhone: string, password: string): Promise<boolean> => {
      try {
        const cleanInput = emailOrPhone.trim();
        const isEmail = cleanInput.includes("@");
        let emailToAuth = cleanInput.toLowerCase();

        if (!isSupabaseConfigured) {
          toast.error("Authentication Service Offline", {
            description: "Supabase connection is not available.",
          });
          return false;
        }

        // If user entered a mobile number, resolve it to the associated email in Supabase
        if (!isEmail) {
          const digits = cleanInput.replace(/\D/g, "");
          const phone10 = digits.slice(-10);
          const { national, e164 } = normalizePhoneNumber(cleanInput);
          let resolvedEmail: string | null = null;

          // 1. Try PostgreSQL RPC function (SECURITY DEFINER bypasses RLS safely)
          try {
            const { data: rpcEmail, error: rpcErr } = await supabase.rpc("get_email_by_phone", {
              p_phone: phone10 || cleanInput,
            });
            if (!rpcErr && rpcEmail && typeof rpcEmail === "string" && rpcEmail.includes("@")) {
              resolvedEmail = rpcEmail.trim().toLowerCase();
            }
          } catch (e: unknown) {
            console.warn("RPC phone lookup notice:", e);
          }

          // 2. Direct profiles table query with multiple phone variations
          if (!resolvedEmail) {
            try {
              const orConditions = [
                `phone.eq.${phone10}`,
                `phone.eq.${cleanInput}`,
                `phone.eq.${national}`,
                `phone.eq.${e164}`,
                `phone.eq.+91 ${phone10}`,
                `phone.eq.+91${phone10}`,
                `phone.ilike.%${phone10}%`,
              ].join(",");

              const { data: foundProfiles } = await supabase
                .from("profiles")
                .select("email, phone")
                .or(orConditions)
                .limit(1);

              if (foundProfiles && foundProfiles.length > 0 && foundProfiles[0]?.email) {
                resolvedEmail = (foundProfiles[0].email as string).trim().toLowerCase();
              }
            } catch (e: unknown) {
              console.warn("Direct profiles phone lookup notice:", e);
            }
          }

          if (resolvedEmail) {
            emailToAuth = resolvedEmail;
          } else {
            toast.error("Account Not Found", {
              description: `No registered account found with mobile number ${cleanInput}. Please sign in with your registered email address.`,
            });
            return false;
          }
        }

        // Authenticate strictly with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToAuth,
          password,
        });

        if (authError) {
          // Strictly fail: If user was deleted from Supabase or password is wrong, access is denied
          toast.error("Authentication Failed", {
            description: authError.message || "Incorrect email, mobile number, or password.",
          });
          return false;
        }

        if (!authData.user) {
          toast.error("Authentication Failed", {
            description: "No user returned from authentication service.",
          });
          return false;
        }

        const customerUser = await fetchAndSyncProfile(authData.user);
        if (customerUser.status === "suspended") {
          await supabase.auth.signOut();
          setCurrentUser(null);
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
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Please check your details and try again.";
        toast.error("Sign-in Error", {
          description: msg,
        });
        return false;
      }
    },
    [],
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
          try {
            const { data: rpcEmail } = await supabase.rpc("get_email_by_phone", {
              p_phone: phone,
            });
            if (rpcEmail) {
              const { data: foundProfiles } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", rpcEmail)
                .limit(1);
              if (foundProfiles?.[0]) {
                userProfile = mapProfileToCustomer(foundProfiles[0] as ProfileRow);
              }
            }
          } catch {
            // Fallback to direct query
          }

          if (!userProfile) {
            const { data: foundProfiles } = await supabase
              .from("profiles")
              .select("*")
              .or(`phone.eq.${phone},phone.eq.${national},phone.eq.+91${national}`)
              .limit(1);

            if (foundProfiles && foundProfiles.length > 0 && foundProfiles[0]) {
              userProfile = mapProfileToCustomer(foundProfiles[0] as ProfileRow);
            }
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
    (cart: { name: string; size: string; color: string; qty: number; price: number; image?: string }[]) => {
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
          productImage: line.image,
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

  // User status toggler (Suspend / Activate) with live database persistence & immediate logout
  const setUserStatus = useCallback(
    async (userId: string, newStatus: "active" | "suspended"): Promise<boolean> => {
      const isSuspending = newStatus === "suspended";
      const targetUser = users.find((u) => u.id === userId);

      // 1. Update persistent local & cross-tab suspension registry
      updateSuspendedRegistry(userId, isSuspending);
      if (targetUser?.email) {
        updateSuspendedRegistry(targetUser.email, isSuspending);
      }
      if (targetUser?.phone) {
        updateSuspendedRegistry(targetUser.phone.replace(/\D/g, ""), isSuspending);
      }

      // 2. Update in local users state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
      );

      // 3. If currently logged-in user is being suspended, terminate session immediately
      if (currentUser?.id === userId && isSuspending) {
        await logout();
        toast.error("Account Suspended", {
          description: "Your session has ended because your account was suspended by administration.",
          duration: 9000,
        });
      }

      // 4. Update Supabase database
      if (isSupabaseConfigured) {
        // Try RPC first (SECURITY DEFINER bypasses RLS safely)
        try {
          const { error: rpcErr } = await supabase.rpc("set_user_status", {
            p_user_id: userId,
            p_status: newStatus,
          });
          if (rpcErr) {
            console.warn("RPC set_user_status notice:", rpcErr.message);
          }
        } catch (e) {
          console.warn("RPC status toggle exception:", e);
        }

        // Direct table update
        try {
          const { error } = await supabase
            .from("profiles")
            .update({
              status: newStatus,
              role: isSuspending ? "suspended" : "customer",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.warn("Supabase profile status update notice:", error.message);
          }
        } catch (err) {
          console.warn("Exception updating profile status in Supabase:", err);
        }
      }

      // 5. Broadcast sync across all open browser tabs and windows
      broadcastSync("USER_STATUS_CHANGED", { userId, status: newStatus });
      return true;
    },
    [currentUser, users, logout],
  );

  // Cross-tab Realtime Sync: Automatically log out suspended users instantly
  useRealtimeSync(
    useCallback(
      (payload: SyncPayload) => {
        if (payload.type === "USER_STATUS_CHANGED" && payload.data) {
          const { userId, status } = payload.data as {
            userId: string;
            status: "active" | "suspended";
          };
          if (currentUser?.id === userId && status === "suspended") {
            void logout();
            toast.error("Account Suspended", {
              description:
                "You have been logged out because your account was suspended by administration.",
              duration: 9000,
            });
          }
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status } : u)),
          );
        }
      },
      [currentUser, logout],
    ),
  );

  // Window Focus verification: Enforce session validity & suspension whenever user returns to tab
  useEffect(() => {
    if (!currentUser) return;

    const verifyActiveStatus = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("status, role")
            .eq("id", currentUser.id)
            .maybeSingle();

          // If user was removed or deleted from Supabase, log out immediately
          if (!profile) {
            await logout();
            return;
          }

          if (
            (profile as any).status === "suspended" ||
            profile.role === "suspended"
          ) {
            await logout();
            toast.error("Account Suspended", {
              description: "Your account has been suspended by administration.",
              duration: 9000,
            });
          }
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("focus", verifyActiveStatus);
    return () => {
      window.removeEventListener("focus", verifyActiveStatus);
    };
  }, [currentUser, logout]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        register,
        verifyEmailOtp,
        resendEmailOtp,
        login,
        loginWithPhoneOtp,
        logout,
        updateProfile,
        syncCartToAdmin,
        syncWishlistToAdmin,
        setUserStatus,
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
