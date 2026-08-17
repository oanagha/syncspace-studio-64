import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/hooks/useWorkspace";
import { canEditWorkspaceContent } from "@/services/workspace.service";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { listProjects, projectQueryKey } from "@/services/project.service";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export function ProjectsPage() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("progress");
  const debouncedSearch = useDebouncedValue(search, 400);

  const workspaceId = activeWorkspace?.id ?? null;
  const workspaceName = activeWorkspace?.name || "this workspace";

  const projectsQuery = useQuery({
    queryKey: projectQueryKey(workspaceId, debouncedSearch, status, sort),
    queryFn: () =>
      listProjects({
        workspaceId: workspaceId!,
        search: debouncedSearch,
        status,
        sort,
      }),
    enabled: Number.isInteger(workspaceId),
  });

  const projects = projectsQuery.data?.projects ?? [];
  const showEmptyWorkspace = !workspaceLoading && !activeWorkspace;
  const showEmptyProjects =
    Boolean(activeWorkspace) &&
    !projectsQuery.isLoading &&
    !projectsQuery.isError &&
    projects.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {activeWorkspace
              ? `${projects.length} project${projects.length === 1 ? "" : "s"} across ${workspaceName}`
              : "Choose a workspace to view its projects."}
          </p>
        </div>
        <CreateProjectModal disabled={!activeWorkspace || !canEditWorkspaceContent(activeWorkspace.role)} />
      </header>

      <ProjectFilters
        search={search}
        status={status}
        sort={sort}
        disabled={!activeWorkspace}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onSortChange={setSort}
      />

      {showEmptyWorkspace && (
        <div className="surface-card grid place-items-center gap-3 px-6 py-16 text-center">
          <FolderKanban className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-bold">No workspace selected</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Create or switch to a workspace to start adding projects.
          </p>
        </div>
      )}

      {activeWorkspace && projectsQuery.isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface-card space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="size-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {activeWorkspace && projectsQuery.isError && (
        <div className="surface-card grid place-items-center gap-3 px-6 py-16 text-center">
          <h2 className="text-lg font-bold">Couldn't load projects</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : "Something went wrong while loading this workspace."}
          </p>
          <Button variant="outline" onClick={() => void projectsQuery.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {showEmptyProjects && (
        <div className="surface-card grid place-items-center gap-3 px-6 py-16 text-center">
          <FolderKanban className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-bold">No projects yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {debouncedSearch || status !== "all"
              ? "No projects match the current search or filters."
              : `Create the first project in ${workspaceName}.`}
          </p>
        </div>
      )}

      {activeWorkspace &&
        !projectsQuery.isLoading &&
        !projectsQuery.isError &&
        projects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                subtitle={workspaceName}
                index={index}
              />
            ))}
          </div>
        )}
    </div>
  );
}
