import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectBoardPage } from "@/pages/ProjectBoardPage";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { listProjects, projectQueryKey } from "@/services/project.service";

const BOARD_PROJECT_KEY = "syncspace-board-project";

function storageKey(workspaceId: number) {
  return `${BOARD_PROJECT_KEY}:${workspaceId}`;
}

function readStoredProjectId(workspaceId: number) {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(storageKey(workspaceId));
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function storeProjectId(workspaceId: number, projectId: number) {
  window.sessionStorage.setItem(storageKey(workspaceId), String(projectId));
}

export function WorkspaceBoardPage() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const [projectId, setProjectId] = useState<number | null>(null);

  const projectsQuery = useQuery({
    queryKey: projectQueryKey(workspaceId, "", "all", "recent"),
    queryFn: () => listProjects({ workspaceId: workspaceId!, sort: "recent" }),
    enabled: Number.isInteger(workspaceId),
  });
  const projects = projectsQuery.data?.projects ?? [];

  useEffect(() => {
    if (!workspaceId) {
      setProjectId(null);
      return;
    }
    if (projectsQuery.isLoading) return;

    const stored = readStoredProjectId(workspaceId);
    const match = projects.find((project) => project.id === stored) ?? projects[0];
    setProjectId(match?.id ?? null);
  }, [workspaceId, projects, projectsQuery.isLoading]);

  const selectProject = (id: string) => {
    const nextId = Number(id);
    if (!workspaceId || !Number.isInteger(nextId) || nextId <= 0) return;
    setProjectId(nextId);
    storeProjectId(workspaceId, nextId);
  };

  if (workspaceLoading || (workspaceId && projectsQuery.isLoading)) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <Skeleton className="h-10 w-72 rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <FolderKanban className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">No workspace selected</h1>
        <p className="text-sm text-muted-foreground">
          Create or switch to a workspace to open its Kanban board.
        </p>
      </div>
    );
  }

  if (projectsQuery.isError) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Could not load projects</h1>
        <p className="text-sm text-muted-foreground">
          {projectsQuery.error instanceof Error
            ? projectsQuery.error.message
            : "Refresh the page to try again."}
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <FolderKanban className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">No projects yet</h1>
        <p className="text-sm text-muted-foreground">
          Create a project in this workspace to load the live Kanban board.
        </p>
        <CreateProjectModal />
        <Button asChild variant="outline">
          <Link to="/app/projects">Go to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Kanban board
          </p>
          <p className="text-sm text-muted-foreground">
            {activeWorkspace.name} · live board from the API
          </p>
        </div>
        <Select value={projectId ? String(projectId) : undefined} onValueChange={selectProject}>
          <SelectTrigger className="h-11 w-full max-w-xs rounded-2xl">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {projectId ? <ProjectBoardPage projectId={projectId} /> : null}
    </div>
  );
}
