import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "SyncSpace Workspace" },
      { name: "description", content: "Your SyncSpace workspace: projects, boards, files, team and analytics in one real-time surface." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});
