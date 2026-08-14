import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/pages/ProjectsPage";

export const Route = createFileRoute("/app/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Browse every workspace project with live progress rings, owners, deadlines and health status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});
