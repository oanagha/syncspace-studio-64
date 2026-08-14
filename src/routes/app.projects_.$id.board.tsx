import { createFileRoute } from "@tanstack/react-router";
import { ProjectBoardPage } from "@/pages/ProjectBoardPage";

export const Route = createFileRoute("/app/projects_/$id/board")({
  head: () => ({
    meta: [
      { title: "Project board — SyncSpace Workspace" },
      {
        name: "description",
        content: "Project-specific kanban board with live details, members and progress.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectBoardRoute,
});

function ProjectBoardRoute() {
  const { id } = Route.useParams();
  const projectId = Number(id);

  return <ProjectBoardPage projectId={projectId} />;
}
