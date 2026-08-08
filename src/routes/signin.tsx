import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AuthLayout, SocialButtons } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in to SyncSpace — Real-time team workspace" },
      { name: "description", content: "Sign in to your SyncSpace workspace to pick up projects, boards and files exactly where your team left them." },
      { property: "og:title", content: "Sign in to SyncSpace" },
      { property: "og:description", content: "Access your real-time collaborative workspace." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const [show, setShow] = useState(false);
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to jump straight back into your workspace."
      footer={
        <>
          New to SyncSpace?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/app";
        }}
      >
        <SocialButtons />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with email{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="ava@northwind.studio" className="h-11 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••••"
              className="h-11 rounded-2xl pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label="Toggle password visibility"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox defaultChecked /> Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
