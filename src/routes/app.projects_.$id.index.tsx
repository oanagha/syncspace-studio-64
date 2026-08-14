import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";

export const Route = createFileRoute("/app/projects_/$id/")({
  head: () => ({
    meta: [
      { title: "Project details — SyncSpace Workspace" },
      {
        name: "description",
        content: "Project overview: status, progress, members, deadline and description.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const { id } = Route.useParams();
  return <ProjectDetailPage projectId={Number(id)} />;
}
