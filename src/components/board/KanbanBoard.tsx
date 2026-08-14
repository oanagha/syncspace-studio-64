import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Pencil } from "lucide-react";
import { AddTaskModal } from "@/components/projects/AddTaskModal";
import { EditTaskModal } from "@/components/projects/EditTaskModal";
import { Button } from "@/components/ui/button";
import { formatProjectDeadline, projectDetailQueryKey } from "@/services/project.service";
import { listTasks, taskQueryKey, updateTaskColumn, type ProjectTask } from "@/services/task.service";
import { cn } from "@/lib/utils";

const COLUMNS = ["Backlog", "Todo", "In Progress", "Review", "Done"];

const priorityStyle: Record<string, string> = {
  Urgent: "bg-destructive/12 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-primary-soft text-primary",
  Low: "bg-muted text-muted-foreground",
};

type KanbanBoardProps = {
  projectId: number;
};

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [defaultColumn, setDefaultColumn] = useState("Todo");
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const tasksQuery = useQuery({
    queryKey: taskQueryKey(projectId),
    queryFn: () => listTasks(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0,
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, column }: { taskId: number; column: string }) =>
      updateTaskColumn(taskId, column),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to move task.");
    },
  });

  const tasks = tasksQuery.data?.tasks ?? [];

  const move = (id: number, column: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.column === column) return;
    moveMutation.mutate({ taskId: id, column });
  };

  const openAdd = (column: string) => {
    setDefaultColumn(column);
    setAddOpen(true);
  };

  return (
    <>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col);
          return (
            <section
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col);
              }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => {
                if (dragId) move(dragId, col);
                setDragId(null);
                setOverCol(null);
              }}
              className={cn(
                "w-[290px] shrink-0 snap-start rounded-3xl border border-border bg-card/60 p-3 transition-colors",
                overCol === col && "border-primary/50 bg-primary-soft/50",
              )}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="text-sm font-bold">{col}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    dragging={dragId === t.id}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    onEdit={() => setEditingTask(t)}
                  />
                ))}

                <button
                  onClick={() => openAdd(col)}
                  className="w-full rounded-2xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  + Add task
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <AddTaskModal
        projectId={projectId}
        defaultColumn={defaultColumn}
        open={addOpen}
        onOpenChange={setAddOpen}
        showTrigger={false}
      />
      <EditTaskModal
        task={editingTask}
        open={Boolean(editingTask)}
        onOpenChange={(next) => {
          if (!next) setEditingTask(null);
        }}
      />
    </>
  );
}

function TaskCard({
  task,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
}: {
  task: ProjectTask;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          e.preventDefault();
          return;
        }
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:cursor-grabbing",
        dragging && "rotate-2 scale-[1.03] shadow-lift",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", priorityStyle[task.priority])}>
          {task.priority}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${task.title}`}
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <h3 className="mt-3 text-sm font-bold leading-snug">{task.title}</h3>
      {task.description?.trim() && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-4 flex items-center text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {formatProjectDeadline(task.due_date)}
        </span>
      </div>
    </article>
  );
}
