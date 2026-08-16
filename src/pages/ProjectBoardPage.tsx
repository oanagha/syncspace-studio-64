import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ProgressCircle } from "@/components/projects/ProgressCircle";
import { ApiRequestError } from "@/lib/api";
import {
  formatProjectDeadline,
  getProject,
  memberAvatarColor,
  memberInitials,
  PROJECT_STATUS_STYLES,
  projectDetailQueryKey,
  type Project,
} from "@/services/project.service";
import { cn } from "@/lib/utils";

type ProjectBoardPageProps = {
  projectId: number;
};

function ProjectMembers({ project }: { project: Project }) {
  const visible = project.members.slice(0, 3);
  const extra = Math.max(project.members.length - visible.length, 0);

  return (
    <div className="flex -space-x-2">
      {visible.map((member) => (
        <span
          key={member.id}
          title={member.name}
          className="grid size-9 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground"
          style={{
            background: member.avatar
              ? `center / cover url(${member.avatar})`
              : memberAvatarColor(member.id),
          }}
        >
          {!member.avatar && memberInitials(member.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className="grid size-9 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function ProjectBoardPage({ projectId }: ProjectBoardPageProps) {
  const projectQuery = useQuery({
    queryKey: projectDetailQueryKey(projectId),
    queryFn: () => getProject(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0,
  });

  const project = projectQuery.data?.project;
  const error = projectQuery.error;
  const isForbidden = error instanceof ApiRequestError && error.status === 403;
  const isNotFound = error instanceof ApiRequestError && error.status === 404;
  const statusStyle =
    PROJECT_STATUS_STYLES[project?.status ?? "On Track"] ?? PROJECT_STATUS_STYLES["On Track"]!;

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="size-16 rounded-full" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <FolderKanban className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">You don't have access to this project</h1>
        <p className="text-sm text-muted-foreground">
          This project belongs to another workspace, or you are not a member.
        </p>
        <Button asChild variant="outline">
          <Link to="/app/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  if (isNotFound || (!project && projectQuery.isError)) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Project not found</h1>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "This project may have been removed."}
        </p>
        <Button asChild variant="outline">
          <Link to="/app/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Link
            to="/app/projects/$id"
            params={{ id: String(project.id) }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Project details
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold",
                statusStyle.badge,
              )}
            >
              {project.status}
            </span>
            <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{project.title}</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {project.description?.trim() || "No description yet."}
          </p>
          <p className="text-sm text-muted-foreground">
            Due {formatProjectDeadline(project.deadline)} · {project.completed_tasks}/
            {project.total_tasks} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressCircle value={project.progress} color={statusStyle.stroke} />
          <ProjectMembers project={project} />
        </div>
      </header>

      <KanbanBoard projectId={project.id} />
    </div>
  );
}
