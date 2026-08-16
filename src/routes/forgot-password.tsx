import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your SyncSpace password" },
      {
        name: "description",
        content: "Reset your SyncSpace password with a verification code sent to your email.",
      },
      { property: "og:title", content: "Reset your SyncSpace password" },
      { property: "og:description", content: "Secure password reset for your SyncSpace account." },
    ],
  }),
  component: Forgot,
});

type Step = "email" | "otp" | "password";

type MessageResponse = {
  message: string;
};

type VerifyOtpResponse = {
  message: string;
  resetToken: string;
};

function Forgot() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiPost<MessageResponse>("/api/auth/forgot-password", {
        email: email.trim(),
      });

      setStep("otp");
      setOtp("");
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Verification code is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiPost<VerifyOtpResponse>("/api/auth/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });

      setResetToken(data.resetToken);
      setStep("password");
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiPost<MessageResponse>("/api/auth/reset-password", {
        resetToken,
        password,
        confirm_password: confirmPassword,
      });

      toast.success(data.message);
      window.location.replace("/signin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    step === "email"
      ? "Forgot password?"
      : step === "otp"
        ? "Enter verification code"
        : "Set a new password";

  const subtitle =
    step === "email"
      ? "Enter your email and we'll send you a 6-digit verification code."
      : step === "otp"
        ? `We sent a code to ${email}. It expires in 10 minutes.`
        : "Choose a strong password you haven't used on SyncSpace before.";

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={
        <>
          Remembered it?{" "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {step === "email" ? (
        <form className="animate-fade-up space-y-5" autoComplete="off" onSubmit={handleSendOtp}>
          <div className="space-y-2">
            <Label htmlFor="fe">Work email</Label>
            <Input
              id="fe"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="you@company.com"
              className="h-11 rounded-2xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending code..." : "Send verification code"}
          </Button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form className="space-y-5" autoComplete="off" onSubmit={handleVerifyOtp}>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="h-11 rounded-2xl text-center text-lg tracking-[0.35em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => {
              setStep("email");
              setOtp("");
            }}
          >
            Use a different email
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="space-y-5" autoComplete="off" onSubmit={handleResetPassword}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="h-11 rounded-2xl pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                readOnly
                onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="h-11 rounded-2xl pr-11"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                readOnly
                onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label="Toggle confirm password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </form>
      ) : null}
    </AuthLayout>
  );
}
