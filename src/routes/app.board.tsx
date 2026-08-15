import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceBoardPage } from "@/pages/WorkspaceBoardPage";

export const Route = createFileRoute("/app/board")({
  head: () => ({
    meta: [
      { title: "Kanban Board — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Live Kanban board with columns, tasks, assignees, priorities, checklists and activity from the API.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceBoardPage,
});
