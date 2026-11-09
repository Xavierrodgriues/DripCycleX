import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AdminCredentials {
  username: string;
  password?: string;
  updatedAt?: string;
}

export interface VerifyAdminResult {
  success: boolean;
  username?: string;
  error?: string;
}

export interface UpdateCredentialsResult {
  success: boolean;
  error?: string;
}

export const FALLBACK_DEFAULT_ADMIN = {
  username: "Dripcyclex",
  password: "admin",
};

/**
 * Fetches the active admin credentials from Supabase database.
 */
export async function fetchAdminCredentials(): Promise<{ username: string; password?: string }> {
  if (!isSupabaseConfigured) {
    return FALLBACK_DEFAULT_ADMIN;
  }

  try {
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("username, password, updated_at")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.warn("Supabase admin_credentials fetch notice:", error.message);
      return FALLBACK_DEFAULT_ADMIN;
    }

    if (data && data.username) {
      return {
        username: data.username,
        password: data.password,
      };
    }
  } catch (err) {
    console.warn("Admin credentials exception:", err);
  }

  return FALLBACK_DEFAULT_ADMIN;
}

/**
 * Authenticates admin login against Supabase database.
 */
export async function verifyAdminLogin(
  inputUser: string,
  inputPass: string,
): Promise<VerifyAdminResult> {
  const cleanUser = inputUser.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    // Offline / unconfigured fallback check
    if (
      cleanUser === FALLBACK_DEFAULT_ADMIN.username.toLowerCase() &&
      inputPass === FALLBACK_DEFAULT_ADMIN.password
    ) {
      return { success: true, username: FALLBACK_DEFAULT_ADMIN.username };
    }
    return { success: false, error: "Invalid credentials." };
  }

  try {
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("username, password")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.warn("Failed fetching admin credentials from Supabase:", error.message);
      // Fallback if table not yet migrated
      if (
        cleanUser === FALLBACK_DEFAULT_ADMIN.username.toLowerCase() &&
        inputPass === FALLBACK_DEFAULT_ADMIN.password
      ) {
        return { success: true, username: FALLBACK_DEFAULT_ADMIN.username };
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      // Table is empty, seed default row and authenticate if default
      if (
        cleanUser === FALLBACK_DEFAULT_ADMIN.username.toLowerCase() &&
        inputPass === FALLBACK_DEFAULT_ADMIN.password
      ) {
        await supabase.from("admin_credentials").upsert({
          id: "primary",
          username: FALLBACK_DEFAULT_ADMIN.username,
          password: FALLBACK_DEFAULT_ADMIN.password,
          updated_at: new Date().toISOString(),
        });
        return { success: true, username: FALLBACK_DEFAULT_ADMIN.username };
      }
      return { success: false, error: "No admin credentials found in Supabase database." };
    }

    const isMatch =
      cleanUser === (data.username || "").trim().toLowerCase() &&
      inputPass === (data.password || "");

    if (isMatch) {
      // Remove any legacy localStorage credentials
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("dripcyclex.admin.credentials");
        } catch {}
      }
      return { success: true, username: data.username };
    }

    return {
      success: false,
      error: "Invalid credentials. Please verify your login name and password.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed connecting to Supabase database.",
    };
  }
}

/**
 * Resets admin credentials in Supabase database back to default factory settings (Dripcyclex / admin).
 */
export async function resetAdminCredentialsToDefault(): Promise<UpdateCredentialsResult> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from("admin_credentials").upsert(
      {
        id: "primary",
        username: FALLBACK_DEFAULT_ADMIN.username,
        password: FALLBACK_DEFAULT_ADMIN.password,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      return { success: false, error: error.message };
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("dripcyclex.admin.credentials");
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to reset credentials in database.",
    };
  }
}
export async function updateAdminCredentialsInSupabase(
  currentPass: string,
  newUsername: string,
  newPassword: string,
): Promise<UpdateCredentialsResult> {
  const cleanUsername = newUsername.trim();

  if (!cleanUsername) {
    return { success: false, error: "Username cannot be empty." };
  }
  if (!newPassword || newPassword.length < 3) {
    return { success: false, error: "New password must be at least 3 characters long." };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "Supabase connection is not configured.",
    };
  }

  try {
    // 1. Verify existing password from Supabase
    const { data, error: fetchErr } = await supabase
      .from("admin_credentials")
      .select("password")
      .eq("id", "primary")
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: `Database check error: ${fetchErr.message}` };
    }

    const existingPassword = data ? data.password : FALLBACK_DEFAULT_ADMIN.password;
    if (currentPass !== existingPassword) {
      return {
        success: false,
        error: "Incorrect current password. Please enter your existing password to verify.",
      };
    }

    // 2. Persist updated credentials in Supabase
    const { error: updateErr } = await supabase
      .from("admin_credentials")
      .upsert(
        {
          id: "primary",
          username: cleanUsername,
          password: newPassword,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (updateErr) {
      return { success: false, error: `Failed to update in database: ${updateErr.message}` };
    }

    // 3. Clear any legacy localStorage credentials
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("dripcyclex.admin.credentials");
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Exception updating credentials in Supabase.",
    };
  }
}
