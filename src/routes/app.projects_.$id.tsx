import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/projects_/$id")({
  component: ProjectIdLayout,
});

function ProjectIdLayout() {
  return <Outlet />;
}
