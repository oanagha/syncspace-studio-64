import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, SocialButtons } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { saveAuth, type RegisterResponse } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your SyncSpace workspace — Free 14-day trial" },
      {
        name: "description",
        content:
          "Start a free SyncSpace workspace in under a minute. Boards, docs, files and analytics that stay in sync with your whole team.",
      },
      { property: "og:title", content: "Create your SyncSpace workspace" },
      { property: "og:description", content: "Free 14-day trial. No credit card required." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workspaceEmail, setWorkspaceEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    if (!lastName.trim()) {
      toast.error("Last name is required.");
      return;
    }

    if (!workspaceEmail.trim()) {
      toast.error("Workspace email is required.");
      return;
    }

    if (!workspaceName.trim()) {
      toast.error("Workspace name is required.");
      return;
    }

    if (workspaceName.trim().length < 3 || workspaceName.trim().length > 100) {
      toast.error("Workspace name must be between 3 and 100 characters.");
      return;
    }

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
      const data = await apiPost<RegisterResponse>("/api/auth/register", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        workspace_email: workspaceEmail.trim(),
        workspace_name: workspaceName.trim(),
        password,
        confirm_password: confirmPassword,
      });

      saveAuth(data.token, {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`.trim(),
        email: data.user.workspace_email,
      });
      toast.success(data.message || "Workspace account created successfully");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Free for 14 days. No credit card, no feature gates."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <SocialButtons />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or sign up with email{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              name="firstName"
              autoComplete="given-name"
              placeholder="Ava"
              className="h-11 rounded-2xl"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              name="lastName"
              autoComplete="family-name"
              placeholder="Mitchell"
              className="h-11 rounded-2xl"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspaceEmail">Workspace email</Label>
          <Input
            id="workspaceEmail"
            name="workspaceEmail"
            type="email"
            autoComplete="off"
            placeholder="you@company.com"
            className="h-11 rounded-2xl"
            value={workspaceEmail}
            onChange={(e) => setWorkspaceEmail(e.target.value)}
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ws">Workspace name</Label>
          <Input
            id="ws"
            name="workspaceName"
            autoComplete="organization"
            placeholder="Northwind Studio"
            className="h-11 rounded-2xl"
            maxLength={100}
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Password</Label>
          <Input
            id="pw"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="h-11 rounded-2xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPw">Confirm password</Label>
          <Input
            id="confirmPw"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className="h-11 rounded-2xl"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating workspace..." : "Create workspace"}
        </Button>
      </form>
    </AuthLayout>
  );
}
