import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { getToken } from "@/lib/auth";

function AppLayout() {
  return (
    <WorkspaceProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </WorkspaceProvider>
  );
}

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getToken()) {
      throw redirect({ to: "/signin" });
    }
  },
  head: () => ({
    meta: [
      { title: "SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Your SyncSpace workspace: projects, boards, files, team and analytics in one real-time surface.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});
