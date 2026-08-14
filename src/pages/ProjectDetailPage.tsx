import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, FolderKanban, ListTodo, Pencil, SquareKanban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTaskModal } from "@/components/projects/AddTaskModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { EditTaskModal } from "@/components/projects/EditTaskModal";
import { ProgressCircle } from "@/components/projects/ProgressCircle";
import { ApiRequestError } from "@/lib/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  canEditProject,
  formatProjectDeadline,
  formatProjectTimestamp,
  getProject,
  memberAvatarColor,
  memberInitials,
  PROJECT_STATUS_STYLES,
  projectDetailQueryKey,
  type Project,
} from "@/services/project.service";
import { listTasks, taskQueryKey, type ProjectTask } from "@/services/task.service";
import { cn } from "@/lib/utils";

type ProjectDetailPageProps = {
  projectId: number;
};

function AccessState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
      <FolderKanban className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline">
        <Link to="/app/projects">Back to projects</Link>
      </Button>
    </div>
  );
}

function MemberList({ project }: { project: Project }) {
  if (project.members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {project.members.map((member) => (
        <li key={member.id} className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-full text-xs font-bold text-primary-foreground"
            style={{
              background: member.avatar
                ? `center / cover url(${member.avatar})`
                : memberAvatarColor(member.id),
            }}
          >
            {!member.avatar && memberInitials(member.name)}
          </span>
          <span className="text-sm font-semibold">{member.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const { activeWorkspace } = useWorkspace();

  const projectQuery = useQuery({
    queryKey: projectDetailQueryKey(projectId),
    queryFn: () => getProject(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0,
  });

  const tasksQuery = useQuery({
    queryKey: taskQueryKey(projectId),
    queryFn: () => listTasks(projectId),
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
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <AccessState
        title="You don't have access to this project"
        message="This project belongs to another workspace, or you are not a member."
      />
    );
  }

  if (isNotFound || (!project && projectQuery.isError)) {
    return (
      <AccessState
        title="Project not found"
        message={error instanceof Error ? error.message : "This project may have been removed."}
      />
    );
  }

  if (!project) return null;

  const tasks = tasksQuery.data?.tasks ?? [];
  const remaining = Math.max(project.total_tasks - project.completed_tasks, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Projects
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold",
                statusStyle.badge,
              )}
            >
              {project.status}
            </span>
            <span
              className="size-3 rounded-full border border-border"
              style={{ background: project.color }}
              title={project.color}
            />
          </div>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeWorkspace?.name || "Workspace"} · Due {formatProjectDeadline(project.deadline)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddTaskModal projectId={project.id} showIcon={false} />
          <Button asChild variant="outline">
            <Link to="/app/projects/$id/board" params={{ id: String(project.id) }}>
              <SquareKanban /> Open board
            </Link>
          </Button>
          {canEditProject(project.role) && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit project
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="surface-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              About
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {project.description?.trim() || "No description yet."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Progress</p>
              <div className="mt-3 flex items-center gap-3">
                <ProgressCircle value={project.progress} color={statusStyle.stroke} size={56} />
                <p className="text-sm font-bold">{project.progress}% complete</p>
              </div>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Tasks</p>
              <p className="mt-3 text-2xl font-extrabold">
                {project.completed_tasks}
                <span className="text-base font-semibold text-muted-foreground">
                  /{project.total_tasks}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{remaining} remaining</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Deadline</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold">
                <Calendar className="size-4 text-muted-foreground" />
                {formatProjectDeadline(project.deadline)}
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="surface-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-bold">Members</h2>
              <span className="ml-auto text-xs font-semibold text-muted-foreground">
                {project.member_count}
              </span>
            </div>
            <MemberList project={project} />
          </section>

          <section className="surface-card space-y-3 p-6 text-sm">
            <h2 className="text-sm font-bold">Details</h2>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Created</span>
              <span className="font-semibold">{formatProjectTimestamp(project.created_at)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Updated</span>
              <span className="font-semibold">{formatProjectTimestamp(project.updated_at)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Your role</span>
              <span className="font-semibold">{project.role || "Member"}</span>
            </div>
          </section>
        </aside>
      </div>

      <section className="surface-card space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Tasks</h2>
          <span className="text-xs font-semibold text-muted-foreground">{tasks.length}</span>
        </div>

        {tasksQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm font-semibold">No tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first task for this project. It will also appear on the board.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{task.title}</p>
                  {task.description?.trim() && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Due {formatProjectDeadline(task.due_date)}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {task.column}
                </span>
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">
                  {task.priority}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${task.title}`}
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingTask(task)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditTaskModal
        task={editingTask}
        open={Boolean(editingTask)}
        onOpenChange={(next) => {
          if (!next) setEditingTask(null);
        }}
      />

      {canEditProject(project.role) && (
        <EditProjectModal project={project} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  );
}
