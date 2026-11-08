import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { broadcastSync } from "@/lib/sync-channel";

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
  ) => boolean;
  login: (emailOrPhone: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<CustomerUser>) => void;
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

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  // Register a new customer
  const register = useCallback(
    (userData: Omit<CustomerUser, "id" | "registeredAt" | "status">, password: string): boolean => {
      try {
        const passwords: StoredUserCredential[] = JSON.parse(
          localStorage.getItem(PASSWORDS_KEY) || "[]",
        );

        // Check if email or phone already registered
        const existing = users.find(
          (u) =>
            u.email.toLowerCase() === userData.email.toLowerCase() ||
            u.phone.trim() === userData.phone.trim(),
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

        // Save password credential
        passwords.push({
          email: userData.email.toLowerCase(),
          phone: userData.phone.trim(),
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
      } catch (err) {
        console.error(err);
        toast.error("Registration Failed", {
          description: "Please check your details and try again.",
        });
        return false;
      }
    },
    [users],
  );

  // Login
  const login = useCallback(
    (emailOrPhone: string, password: string): boolean => {
      try {
        const passwords: StoredUserCredential[] = JSON.parse(
          localStorage.getItem(PASSWORDS_KEY) || "[]",
        );

        const cleanInput = emailOrPhone.trim().toLowerCase();
        const matchedCred = passwords.find(
          (c) => (c.email === cleanInput || c.phone === cleanInput) && c.password === password,
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
      } catch (err) {
        console.error(err);
        toast.error("Sign-in Error");
        return false;
      }
    },
    [users],
  );

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    toast.info("Signed Out", { description: "You have been signed out." });
  }, []);

  // Update profile
  const updateProfile = useCallback(
    (data: Partial<CustomerUser>) => {
      if (!currentUser) return;
      const updated: CustomerUser = { ...currentUser, ...data };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("Profile Updated", { description: "Your details have been saved." });
    },
    [currentUser],
  );

  // Sync Cart lines to Admin storage
  const syncCartToAdmin = useCallback(
    (cart: { name: string; size: string; color: string; qty: number; price: number }[]) => {
      try {
        const allAdminCarts: UserCartRecord[] = JSON.parse(localStorage.getItem(CARTS_KEY) || "[]");

        // Attribute to registered customer if available, otherwise storefront shopper
        const activeUser = currentUser || (users.length > 0 ? users[0] : null);
        const userId = activeUser ? activeUser.id : "guest-visitor";
        const userName = activeUser ? activeUser.name : "Active Shopper (Storefront)";
        const userPhone = activeUser ? activeUser.phone : "+91 84697 11940";
        const userEmail = activeUser ? activeUser.email : "shopper@dripcyclex.com";

        // Only remove items belonging to this specific user ID
        const filtered = allAdminCarts.filter((c) => c.userId !== userId);

        // Add current items
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

        // Only remove wishlist items for this specific user
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
