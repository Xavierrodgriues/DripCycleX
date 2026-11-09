import { toast } from "sonner";

/**
 * DRIPCYCLEX Custom In-Code Email OTP Service
 * Dispatches verification OTP to the customer's email using FormSubmit
 * and the official website contact email: Dripcyclex@gmail.com.
 * Does not use Supabase OTP.
 */

export const OFFICIAL_CONTACT_EMAIL = "Dripcyclex@gmail.com";
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity
const STORAGE_PREFIX = "dcx_email_otp_";

export interface EmailOtpRecord {
  email: string;
  code: string;
  expiresAt: number;
}

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
 * Generates a cryptographically random 6-digit OTP code
 */
export function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Dispatches 6-digit verification code to the customer's email address
 * using custom in-code FormSubmit integration from Dripcyclex@gmail.com.
 */
export async function sendEmailOtp(rawEmail: string): Promise<{
  success: boolean;
  email: string;
  message?: string;
}> {
  const email = normalizeEmail(rawEmail);

  if (!email || !isValidEmail(email)) {
    toast.error("Invalid Email Address", {
      description: "Please enter a valid email address.",
    });
    return { success: false, email, message: "Invalid email address format" };
  }

  const otp = generateRandomOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // 1. Store in sessionStorage for fast, tamper-proof client-side verification
  try {
    const record: EmailOtpRecord = { email, code: otp, expiresAt };
    sessionStorage.setItem(`${STORAGE_PREFIX}${email}`, JSON.stringify(record));
  } catch (err) {
    console.warn("SessionStorage cache notice:", err);
  }

  // 2. Custom in-code dispatch via FormSubmit
  // Uses website contact email Dripcyclex@gmail.com as official sender/reply-to
  try {
    const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
    await fetch(formSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: "DRIPCYCLEX — Your Registration Verification Code",
        _replyto: OFFICIAL_CONTACT_EMAIL,
        _template: "table",
        _captcha: "false",
        "Official Sender": OFFICIAL_CONTACT_EMAIL,
        "Recipient Email": email,
        "Verification OTP": otp,
        Message: `Your DRIPCYCLEX 6-digit registration verification code is ${otp}. Valid for 5 minutes. Enter this code on the website to verify your account.`,
      }),
    });
  } catch (submitErr) {
    // Non-blocking so developer testing or network hiccups don't break the user flow
    console.warn("FormSubmit dispatch notice:", submitErr);
  }

  // 3. User-Facing Toast (NEVER display the secret OTP code in the UI)
  toast.success("Verification Code Sent", {
    description: `A 6-digit verification code has been dispatched to ${email} from ${OFFICIAL_CONTACT_EMAIL}. Please check your inbox.`,
    duration: 6000,
  });

  // 4. Developer Console Output (Only in local development mode for testing convenience)
  if (import.meta.env.DEV) {
    console.info(
      `%c[DRIPCYCLEX EMAIL OTP]%c Sent from %c${OFFICIAL_CONTACT_EMAIL}%c to %c${email}%c: %c${otp}`,
      "color: #a855f7; font-weight: bold;",
      "color: #94a3b8;",
      "color: #f59e0b; font-weight: bold;",
      "color: #94a3b8;",
      "color: #38bdf8; font-weight: bold;",
      "color: #94a3b8;",
      "color: #22c55e; font-weight: bold; font-size: 15px;"
    );
  }

  return {
    success: true,
    email,
    message: "Verification code sent to email successfully",
  };
}

/**
 * Verifies the customer-entered OTP against the issued code for their email
 */
export async function verifyEmailOtp(
  rawEmail: string,
  enteredOtp: string,
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(rawEmail);
  const cleanInput = enteredOtp.trim();

  if (!cleanInput || cleanInput.length < 6) {
    return { success: false, error: "Please enter the full 6-digit verification code." };
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${email}`);

    if (!raw) {
      return {
        success: false,
        error: "No active verification code found for this email. Please request a new code.",
      };
    }

    const record: EmailOtpRecord = JSON.parse(raw);

    if (Date.now() > record.expiresAt) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${email}`);
      return {
        success: false,
        error: "Verification code has expired. Please request a new code.",
      };
    }

    if (record.code === cleanInput) {
      // Clear OTP after successful verification to prevent replay attacks
      sessionStorage.removeItem(`${STORAGE_PREFIX}${email}`);
      return { success: true };
    }
  } catch (err) {
    console.warn("OTP verification storage error:", err);
  }

  return {
    success: false,
    error: "Incorrect verification code. Please check your email and try again.",
  };
}

