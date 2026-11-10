import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  ShoppingBag,
  Heart,
  LogOut,
  Smartphone,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { DripcycleXLogo } from "@/components/logo";
import { useAuth } from "@/lib/auth-store";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const {
    currentUser,
    login,
    loginWithPhoneOtp,
    register,
    verifyEmailOtp,
    resendEmailOtp,
    logout,
  } = useAuth();
  const { cartCount, wishlist } = useShop();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regZip, setRegZip] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Supabase + Resend verification state
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Timer cooldown effect for email verification OTP
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => setVerifyCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown]);

  // Submit Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await login(loginIdentifier, loginPassword);
      if (success) {
        navigate({ to: "/" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Registration via Supabase + Resend SMTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = regPhone.replace(/\D/g, "");
    if (!regName.trim() || !regEmail.trim() || !cleanPhone) {
      toast.error("Required Information Missing", {
        description: "Please enter your full name, email, and 10-digit contact number.",
      });
      return;
    }

    if (cleanPhone.length !== 10) {
      toast.error("Invalid Contact Number", {
        description: "Contact number must be exactly 10 digits without country code (+91) or special characters.",
      });
      return;
    }

    if (!regAddress.trim() || !regCity.trim() || !regZip.trim()) {
      toast.error("Shipping Address Missing", {
        description: "Please complete your delivery address and postal code.",
      });
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Password Too Short", {
        description: "Please create a password of at least 6 characters.",
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords Do Not Match", {
        description: "Password and confirmation must match.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(
        {
          name: regName.trim(),
          email: regEmail.trim(),
          phone: cleanPhone,
          address: regAddress.trim(),
          city: regCity.trim(),
          state: regState.trim() || "State",
          zipCode: regZip.trim(),
        },
        regPassword,
      );

      if (res.success) {
        if (res.requiresEmailVerification) {
          setPendingVerifyEmail(regEmail.trim().toLowerCase());
          setIsAwaitingVerification(true);
          setVerifyCooldown(60);
          setVerificationCode("");
        } else {
          navigate({ to: "/" });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Verification Code via Supabase verifyOtp
  const handleConfirmVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length < 6) {
      toast.error("Complete Code Required", {
        description: "Please enter the full 6-digit confirmation code.",
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyEmailOtp(pendingVerifyEmail, verificationCode.trim());
      if (res.success) {
        toast.success("Account Activated!", {
          description: "Your email has been verified. Welcome to DRIPCYCLEX.",
        });
        navigate({ to: "/" });
      } else {
        toast.error("Verification Failed", {
          description:
            res.error || "Invalid or expired code. Please check your email or request a new code.",
        });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend Supabase verification email via Resend SMTP
  const handleResendVerificationCode = async () => {
    if (verifyCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await resendEmailOtp(pendingVerifyEmail);
      if (res.success) {
        setVerifyCooldown(60);
        setVerificationCode("");
      } else {
        toast.error("Resend Failed", {
          description: res.error || "Unable to resend confirmation email.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  // Dedicated Verification Screen when Supabase + Resend requires confirmation
  if (isAwaitingVerification) {
    return (
      <div className="min-h-[85vh] bg-black text-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md border border-white/15 bg-zinc-950 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              DRIPCYCLEX AUTHENTICATION
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Verify Your Email
            </h2>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              We have dispatched a 6-digit confirmation code to{" "}
              <strong className="text-white font-mono">{pendingVerifyEmail}</strong> from{" "}
              <span className="text-emerald-400 font-mono">no-reply@dripcyclex.in</span>.
            </p>
          </div>

          <form onSubmit={handleConfirmVerificationCode} className="space-y-5">
            <div>
              <label className="block text-center text-zinc-400 uppercase font-bold tracking-wider text-[11px] mb-2">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center py-1">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(val) => setVerificationCode(val)}
                  autoFocus
                >
                  <InputOTPGroup className="gap-1.5 sm:gap-2">
                    <InputOTPSlot index={0} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                    <InputOTPSlot index={1} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                    <InputOTPSlot index={2} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                    <InputOTPSlot index={3} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                    <InputOTPSlot index={4} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                    <InputOTPSlot index={5} className="border-white/30 bg-black text-white h-11 w-11 text-base font-bold" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || verificationCode.trim().length < 6}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded font-black uppercase tracking-[0.18em] text-xs transition-colors hover:bg-zinc-200 disabled:opacity-40"
            >
              {isVerifyingOtp ? "Activating..." : "Verify & Activate Account"}
            </button>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={isResending || verifyCooldown > 0}
                onClick={handleResendVerificationCode}
                className="text-zinc-400 hover:text-white transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                {verifyCooldown > 0 ? `Resend Code (${verifyCooldown}s)` : "Resend Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAwaitingVerification(false);
                  setVerificationCode("");
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors underline"
              >
                Change Email / Back
              </button>
            </div>

            <div className="text-center pt-1">
              <p className="text-[11px] text-zinc-500">
                Tip: You can also click the activation link inside the email to verify instantly.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If already logged in, show User Profile Overview
  if (currentUser) {
    return (
      <div className="min-h-[85vh] bg-black text-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg border border-white/15 bg-zinc-950 p-6 sm:p-10 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-red-500">
                DRIPCYCLEX MEMBER
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                {currentUser.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="border border-white/10 bg-black p-4 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <ShoppingBag className="h-4 w-4" />
                <span>Bag Items</span>
              </div>
              <p className="text-2xl font-black text-white mt-1">{cartCount}</p>
            </div>
            <div className="border border-white/10 bg-black p-4 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Saved Archive</span>
              </div>
              <p className="text-2xl font-black text-white mt-1">{wishlist.length}</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3 text-xs border border-white/10 bg-black/60 p-4 rounded-lg">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-500 uppercase font-bold tracking-wider">
                Contact Phone
              </span>
              <span className="font-mono text-white flex items-center gap-1.5">
                {currentUser.phone}
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-500 uppercase font-bold tracking-wider">
                Delivery Address
              </span>
              <span className="text-white text-right max-w-xs">{currentUser.address}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-500 uppercase font-bold tracking-wider">
                City / Pincode
              </span>
              <span className="text-white">
                {currentUser.city}, {currentUser.zipCode}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500 uppercase font-bold tracking-wider">Member Since</span>
              <span className="font-mono text-zinc-400">{currentUser.registeredAt}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/shop"
              className="flex-1 text-center bg-white text-black py-3 px-4 rounded text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors"
            >
              Explore Drops
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 border border-red-500/30 bg-red-950/30 text-red-300 py-3 px-4 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-900/50 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-black text-white flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md border border-white/15 bg-zinc-950 p-6 sm:p-10 rounded-2xl shadow-2xl relative z-10">
        {/* Emblem & Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <DripcycleXLogo className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <h1 className="mt-3 font-brand text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white">
            DRIPCYCLE<span className="text-red-500 font-black">X</span> ACCOUNT
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {mode === "login"
              ? "Sign in using Email or Registered Mobile Number."
              : "Register your client profile with verified phone confirmation."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-black border border-white/10 rounded-lg mb-6">
          <button
            onClick={() => setMode("login")}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
              mode === "login" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("register")}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
              mode === "register" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* ======================================================== */}
        {/* LOGIN FORM */}
        {/* ======================================================== */}
        {mode === "login" && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1.5">
                  Email or Registered Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="rohan@example.com or 9876543210"
                    className="w-full border border-white/15 bg-black px-3.5 py-2.5 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-white/15 bg-black px-3.5 py-2.5 text-white rounded focus:border-white focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded font-black uppercase tracking-[0.18em] text-xs transition-colors hover:bg-zinc-200 disabled:opacity-50 mt-2"
              >
                Sign In to Syndicate <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-center text-zinc-400 text-[11px] pt-2">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-white underline font-bold hover:text-zinc-300"
              >
                Create one now
              </button>
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* REGISTER FORM */}
        {/* ======================================================== */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="rohan@gmail.com"
                className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none transition-colors"
              />
            </div>

            {/* Contact Mobile Number - 10 Digits Only, No special chars or country code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                  Contact Mobile Number *
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {regPhone.length}/10 digits
                </span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                value={regPhone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setRegPhone(digitsOnly);
                }}
                placeholder="9876543210"
                className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none font-mono tracking-wider transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Enter strictly 10 digits. Do not include +91, 0, spaces, or hyphens.
              </p>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Flat / House No., Tower, Street"
                className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Zip Code *
                </label>
                <input
                  type="text"
                  required
                  value={regZip}
                  onChange={(e) => setRegZip(e.target.value)}
                  placeholder="400050"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showRegPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded font-black uppercase tracking-[0.18em] text-xs transition-colors hover:bg-zinc-200 disabled:opacity-50 mt-4"
            >
              Complete Registration <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-zinc-400 text-[11px] pt-1">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-white underline font-bold hover:text-zinc-300"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
