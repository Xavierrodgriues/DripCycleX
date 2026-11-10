import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * DRIPCYCLEX Supabase + Resend Email Authentication Service
 * Dispatches verification emails through Supabase Auth using the custom Resend SMTP
 * provider (no-reply@dripcyclex.in).
 * FormSubmit has been completely removed.
 */

export const RESEND_SENDER_EMAIL = "no-reply@dripcyclex.in";

/**
 * Normalizes an email address to lowercase and trimmed string
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates standard email address format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/**
 * Dispatches verification OTP code to the customer's email address via Supabase + Resend SMTP
 */
export async function sendEmailOtp(rawEmail: string): Promise<{
  success: boolean;
  email: string;
  error?: string;
}> {
  const email = normalizeEmail(rawEmail);

  if (!email || !isValidEmail(email)) {
    toast.error("Invalid Email Address", {
      description: "Please enter a valid email address.",
    });
    return { success: false, email, error: "Invalid email address format" };
  }

  if (!isSupabaseConfigured) {
    return { success: true, email };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      toast.error("Failed to Send Verification", {
        description: error.message,
      });
      return { success: false, email, error: error.message };
    }

    toast.success("Verification Code Sent", {
      description: `A 6-digit confirmation code has been dispatched to ${email} via ${RESEND_SENDER_EMAIL}.`,
    });
    return { success: true, email };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error sending verification email.";
    toast.error("Dispatch Error", { description: msg });
    return { success: false, email, error: msg };
  }
}

/**
 * Verifies the customer-entered OTP against Supabase
 */
export async function verifyEmailOtp(
  rawEmail: string,
  enteredOtp: string,
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(rawEmail);
  const cleanToken = enteredOtp.trim();

  if (!cleanToken || cleanToken.length < 6) {
    return { success: false, error: "Please enter the full 6-digit verification code." };
  }

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: "signup",
    });

    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: "email",
      });
      if (retry.error) {
        return { success: false, error: retry.error.message || error.message };
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification error.";
    return { success: false, error: msg };
  }
}
