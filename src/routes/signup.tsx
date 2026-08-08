import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout, SocialButtons } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your SyncSpace workspace — Free 14-day trial" },
      { name: "description", content: "Start a free SyncSpace workspace in under a minute. Boards, docs, files and analytics that stay in sync with your whole team." },
      { property: "og:title", content: "Create your SyncSpace workspace" },
      { property: "og:description", content: "Free 14-day trial. No credit card required." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
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
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/app";
        }}
      >
        <SocialButtons />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or sign up with email{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first">First name</Label>
            <Input id="first" placeholder="Ava" className="h-11 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" placeholder="Mitchell" className="h-11 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email2">Work email</Label>
          <Input id="email2" type="email" placeholder="ava@northwind.studio" className="h-11 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ws">Workspace name</Label>
          <Input id="ws" placeholder="Northwind Studio" className="h-11 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" placeholder="At least 10 characters" className="h-11 rounded-2xl" />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox className="mt-0.5" defaultChecked /> I agree to the Terms of Service and Privacy
          Policy.
        </label>
        <Button type="submit" variant="hero" size="lg" className="w-full">
          Create workspace
        </Button>
      </form>
    </AuthLayout>
  );
}
