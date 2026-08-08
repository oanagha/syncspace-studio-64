import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your SyncSpace password" },
      { name: "description", content: "Send yourself a secure reset link and get back into your SyncSpace workspace in a couple of minutes." },
      { property: "og:title", content: "Reset your SyncSpace password" },
      { property: "og:description", content: "Secure password reset for your SyncSpace account." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Forgot password?"}
      subtitle={
        sent
          ? "We sent a secure reset link to ava@northwind.studio. It expires in 30 minutes."
          : "Enter your email and we'll send you a secure reset link."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="animate-pop rounded-3xl surface-card p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <MailCheck className="size-6" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Didn't get it? Check spam, or resend in <span className="font-semibold text-foreground">42s</span>.
          </p>
          <Button variant="outline" className="mt-5 w-full" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form
          className="animate-fade-up space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fe">Work email</Label>
            <Input id="fe" type="email" placeholder="ava@northwind.studio" className="h-11 rounded-2xl" />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
