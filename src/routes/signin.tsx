import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, SocialButtons } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { saveAuth, type LoginResponse } from "@/lib/auth";

type SignInSearch = {
  next?: string;
};

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>): SignInSearch => {
    const next = search["next"];
    if (typeof next === "string" && next.startsWith("/")) {
      return { next };
    }
    return {};
  },
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
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiPost<LoginResponse>("/api/auth/login", {
        email: email.trim(),
        password,
      });

      saveAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Prefer typed invite navigation so we stay in-app after sign-in.
      const inviteMatch = next?.match(/^\/invite\/([^/?#]+)/);
      if (inviteMatch?.[1]) {
        void navigate({
          to: "/invite/$inviteId",
          params: { inviteId: inviteMatch[1] },
        });
      } else if (next?.startsWith("/")) {
        window.location.assign(next);
      } else {
        void navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
        <SocialButtons />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with email{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="off"
              placeholder="Enter your password"
              className="h-11 rounded-2xl pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
              required
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
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
