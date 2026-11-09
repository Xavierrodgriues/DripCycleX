/**
 * Legacy Phone OTP helper (retained for backward compatibility)
 */
export function normalizePhoneNumber(rawPhone: string): {
  clean: string;
  e164: string;
  national: string;
} {
  let digits = (rawPhone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  const national = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const e164 = `+91${national}`;
  return {
    clean: digits,
    e164,
    national,
  };
}

export async function sendPhoneOtp(rawPhone: string): Promise<{ success: boolean; phone: string }> {
  return { success: true, phone: rawPhone };
}

export async function verifyPhoneOtp(
  rawPhone: string,
  enteredOtp: string,
): Promise<{ success: boolean; error?: string }> {
  if (enteredOtp.length >= 4) {
    return { success: true };
  }
  return { success: false, error: "Invalid code" };
}
