import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { getToken } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getToken()) {
      throw redirect({ to: "/signin" });
    }
  },
  head: () => ({
    meta: [
      { title: "SyncSpace Workspace" },
      { name: "description", content: "Your SyncSpace workspace: projects, boards, files, team and analytics in one real-time surface." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});
