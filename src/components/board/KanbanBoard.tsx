import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, GripVertical, ListChecks, Pencil, Trash2 } from "lucide-react";
import { AddColumnModal } from "@/components/board/AddColumnModal";
import { DeleteColumnModal } from "@/components/board/DeleteColumnModal";
import { EditColumnModal } from "@/components/board/EditColumnModal";
import { TaskAssigneePicker } from "@/components/board/TaskAssigneePicker";
import { TaskDueDatePicker } from "@/components/board/TaskDueDatePicker";
import { TaskPriorityPicker } from "@/components/board/TaskPriorityPicker";
import { AddTaskModal } from "@/components/projects/AddTaskModal";
import { EditTaskModal } from "@/components/projects/EditTaskModal";
import {
  ConfirmDeleteDialog,
  DeleteEntityName,
} from "@/components/ux/ConfirmDeleteDialog";
import { useDeleteTask } from "@/hooks/useDeleteTask";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { boardQueryKey, getBoard } from "@/services/board.service";
import {
  applyColumnReorder,
  applyColumnShift,
  columnQueryKey,
  columnTitle,
  reorderColumns,
  type BoardColumn,
} from "@/services/column.service";
import { projectDetailQueryKey } from "@/services/project.service";
import { subtaskQueryKey } from "@/services/subtask.service";
import {
  applyTaskAssignee,
  applyTaskMove,
  applyTaskPatch,
  assignTask,
  taskDetailQueryKey,
  taskQueryKey,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
  type ProjectTask,
  type TaskAssignee,
} from "@/services/task.service";
import { cn } from "@/lib/utils";

type KanbanBoardProps = {
  projectId: number;
};

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragColumnId, setDragColumnId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<number | null>(null);
  const [overTaskId, setOverTaskId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<BoardColumn | null>(null);
  const [defaultColumn, setDefaultColumn] = useState("Todo");
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [pendingTaskDelete, setPendingTaskDelete] = useState<ProjectTask | null>(null);
  const deleteTask = useDeleteTask(projectId, () => setEditingTask(null));

  const boardQuery = useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: async () => {
      const data = await getBoard(projectId);
      queryClient.setQueryData(columnQueryKey(projectId), { columns: data.columns });
      queryClient.setQueryData(taskQueryKey(projectId), { tasks: data.tasks });
      for (const task of data.tasks) {
        queryClient.setQueryData(subtaskQueryKey(task.id), {
          subtasks: task.subtasks ?? [],
          subtasks_done: task.subtasks_done ?? 0,
          subtasks_total: task.subtasks_total ?? 0,
        });
        if (task.watching !== undefined) {
          queryClient.setQueryData(taskDetailQueryKey(task.id), { task });
        }
      }
      return data;
    },
    enabled: Number.isInteger(projectId) && projectId > 0,
  });

  const columnsQuery = useQuery({
    queryKey: columnQueryKey(projectId),
    queryFn: async () => ({ columns: boardQuery.data?.columns ?? [] }),
    enabled: false,
  });

  const tasksQuery = useQuery({
    queryKey: taskQueryKey(projectId),
    queryFn: async () => ({ tasks: boardQuery.data?.tasks ?? [] }),
    enabled: false,
  });
  const members = boardQuery.data?.assignees ?? [];
  const activity = boardQuery.data?.activity;

  const moveMutation = useMutation({
    mutationFn: ({
      taskId,
      columnId,
      order,
    }: {
      taskId: number;
      columnId: string;
      order: number;
    }) => updateTaskStatus(taskId, { columnId, order }),
    onMutate: async ({ taskId, columnId, order }) => {
      const key = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: ProjectTask[] }>(key);
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(key, (current) => {
        if (!current) return current;
        return { tasks: applyTaskMove(current.tasks, taskId, columnId, order) };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to move task.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
        if (!current) return { tasks: [data.task] };
        return {
          tasks: applyTaskMove(current.tasks, data.task.id, data.status.columnId, data.status.order),
        };
      });
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: number; assigneeId: number | null }) =>
      assignTask(taskId, assigneeId),
    onMutate: async ({ taskId, assigneeId }) => {
      const key = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: ProjectTask[] }>(key);
      const member = assigneeId == null ? null : members.find((item) => item.id === assigneeId);
      const assignee: TaskAssignee | null = member
        ? { id: member.id, name: member.name }
        : null;
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(key, (current) => {
        if (!current) return current;
        return { tasks: applyTaskAssignee(current.tasks, taskId, assignee) };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to assign task.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
        if (!current) return { tasks: [data.task] };
        return {
          tasks: current.tasks.map((task) => (task.id === data.task.id ? data.task : task)),
        };
      });
      void queryClient.setQueryData(taskDetailQueryKey(data.task.id), { task: data.task });
    },
  });

  const replaceTask = (task: ProjectTask) => {
    queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
      if (!current) return { tasks: [task] };
      return { tasks: current.tasks.map((item) => (item.id === task.id ? task : item)) };
    });
    queryClient.setQueryData(taskDetailQueryKey(task.id), { task });
  };

  const priorityMutation = useMutation({
    mutationFn: ({ taskId, priority }: { taskId: number; priority: string }) =>
      updateTaskPriority(taskId, priority),
    onMutate: async ({ taskId, priority }) => {
      const key = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: ProjectTask[] }>(key);
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(key, (current) => {
        if (!current) return current;
        return { tasks: applyTaskPatch(current.tasks, taskId, { priority }) };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update priority.");
    },
    onSuccess: (data) => replaceTask(data.task),
  });

  const dueDateMutation = useMutation({
    mutationFn: ({ taskId, dueDate }: { taskId: number; dueDate: string | null }) =>
      updateTaskDueDate(taskId, dueDate),
    onMutate: async ({ taskId, dueDate }) => {
      const key = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: ProjectTask[] }>(key);
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(key, (current) => {
        if (!current) return current;
        return { tasks: applyTaskPatch(current.tasks, taskId, { due_date: dueDate }) };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update due date.");
    },
    onSuccess: (data) => replaceTask(data.task),
  });

  const reorderMutation = useMutation({
    mutationFn: (next: BoardColumn[]) =>
      reorderColumns(next.map((column) => ({ id: column.id, position: column.position }))),
    onMutate: async (next) => {
      const key = columnQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ columns: BoardColumn[] }>(key);
      queryClient.setQueryData(key, { columns: next });
      return { previous };
    },
    onError: (err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(columnQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to reorder columns.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(columnQueryKey(projectId), { columns: data.columns });
    },
  });

  const columns = columnsQuery.data?.columns ?? boardQuery.data?.columns ?? [];
  const tasks = tasksQuery.data?.tasks ?? boardQuery.data?.tasks ?? [];
  const firstColumn = columns[0] ? columnTitle(columns[0]) : "Todo";

  const move = (id: number, column: string, insertBeforeId?: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const colTasks = tasks
      .filter((item) => item.column === column)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    let order = colTasks.filter((item) => item.id !== id).length;
    if (insertBeforeId) {
      const insertIndex = colTasks.findIndex((item) => item.id === insertBeforeId);
      const dragIndex = colTasks.findIndex((item) => item.id === id);
      if (insertIndex >= 0) {
        order = dragIndex !== -1 && dragIndex < insertIndex ? insertIndex - 1 : insertIndex;
      }
    }

    if (task.column === column && (task.order ?? 0) === order) return;
    moveMutation.mutate({ taskId: id, columnId: column, order });
  };

  const openAdd = (column: string) => {
    setDefaultColumn(column);
    setAddOpen(true);
  };

  const persistColumnOrder = (next: BoardColumn[] | null) => {
    if (!next) return;
    const unchanged =
      next.length === columns.length &&
      next.every((column, index) => column.id === columns[index]?.id && column.position === columns[index]?.position);
    if (unchanged) return;
    reorderMutation.mutate(next);
  };

  if (boardQuery.isLoading) {
    return (
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[420px] w-[290px] shrink-0 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (boardQuery.isError) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-semibold">Could not load board</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {boardQuery.error instanceof Error
            ? boardQuery.error.message
            : "Refresh the page to try again."}
        </p>
      </div>
    );
  }

  return (
    <>
      {activity && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
          <span>
            {activity.completed_tasks}/{activity.total_tasks} done
          </span>
          <span>{activity.in_progress_tasks} in progress</span>
          <span>{activity.overdue_tasks} overdue</span>
          <span>
            {activity.subtasks_done}/{activity.subtasks_total} checklist
          </span>
          <span>{activity.comments_count} comments</span>
        </div>
      )}
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {columns.map((column, index) => {
          const col = columnTitle(column);
          const colTasks = tasks
            .filter((t) => t.column === col)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          return (
            <section
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragColumnId) {
                  setOverColumnId(column.id);
                  return;
                }
                setOverCol(col);
              }}
              onDragLeave={() => {
                setOverCol((c) => (c === col ? null : c));
                setOverColumnId((id) => (id === column.id ? null : id));
                setOverTaskId(null);
              }}
              onDrop={() => {
                if (dragColumnId) {
                  persistColumnOrder(applyColumnReorder(columns, dragColumnId, column.id));
                  setDragColumnId(null);
                  setOverColumnId(null);
                  return;
                }
                if (dragId) move(dragId, col, overTaskId ?? undefined);
                setDragId(null);
                setOverCol(null);
                setOverTaskId(null);
              }}
              className={cn(
                "w-[290px] shrink-0 snap-start rounded-3xl border border-border bg-card/60 p-3 transition-colors",
                overCol === col && !dragColumnId && "border-primary/50 bg-primary-soft/50",
                (dragColumnId === column.id || overColumnId === column.id) &&
                  "border-primary/50 bg-primary-soft/50",
              )}
              style={{ boxShadow: `inset 4px 0 0 ${column.color || "#14B8A6"}` }}
            >
              <div className="flex items-center justify-between gap-1 px-1 py-2">
                <div
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement).closest("button")) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", `column:${column.id}`);
                    setDragColumnId(column.id);
                    setDragId(null);
                  }}
                  onDragEnd={() => {
                    setDragColumnId(null);
                    setOverColumnId(null);
                  }}
                  className="flex min-w-0 cursor-grab items-center gap-2 active:cursor-grabbing"
                >
                  <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: column.color || "#14B8A6" }}
                  />
                  <h2 className="truncate text-sm font-bold">{col}</h2>
                </div>
                <div className="flex shrink-0 items-center">
                  <span className="mr-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                    {colTasks.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    disabled={index === 0 || reorderMutation.isPending}
                    aria-label={`Move ${col} left`}
                    onClick={() => persistColumnOrder(applyColumnShift(columns, column.id, -1))}
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    disabled={index === columns.length - 1 || reorderMutation.isPending}
                    aria-label={`Move ${col} right`}
                    onClick={() => persistColumnOrder(applyColumnShift(columns, column.id, 1))}
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${col}`}
                    onClick={() => setEditingColumn(column)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    disabled={columns.length <= 1}
                    aria-label={`Delete ${col}`}
                    title={columns.length <= 1 ? "Cannot delete the last remaining column" : `Delete ${col}`}
                    onClick={() => setDeletingColumn(column)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    dragging={dragId === t.id}
                    dropTarget={overTaskId === t.id && !dragColumnId}
                    isReorderingColumns={Boolean(dragColumnId)}
                    onDragStart={() => {
                      setDragColumnId(null);
                      setDragId(t.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverTaskId(null);
                    }}
                    onDragOver={() => setOverTaskId(t.id)}
                    onEdit={() => setEditingTask(t)}
                    members={members}
                    onAssign={(assigneeId) =>
                      assignMutation.mutate({ taskId: t.id, assigneeId })
                    }
                    onPriorityChange={(priority) =>
                      priorityMutation.mutate({ taskId: t.id, priority })
                    }
                    onDueDateChange={(dueDate) =>
                      dueDateMutation.mutate({ taskId: t.id, dueDate })
                    }
                    onDelete={() => setPendingTaskDelete(t)}
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

        <button
          type="button"
          onClick={() => setAddColumnOpen(true)}
          className="flex w-[290px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/40 px-4 py-10 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          + Add column
        </button>
      </div>

      <AddColumnModal
        projectId={projectId}
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
      />
      <EditColumnModal
        projectId={projectId}
        column={editingColumn}
        open={Boolean(editingColumn)}
        onOpenChange={(next) => {
          if (!next) setEditingColumn(null);
        }}
      />
      <DeleteColumnModal
        projectId={projectId}
        column={deletingColumn}
        columns={columns}
        taskCount={
          deletingColumn
            ? tasks.filter((task) => task.column === columnTitle(deletingColumn)).length
            : 0
        }
        open={Boolean(deletingColumn)}
        onOpenChange={(next) => {
          if (!next) setDeletingColumn(null);
        }}
      />
      <AddTaskModal
        projectId={projectId}
        defaultColumn={defaultColumn || firstColumn}
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
      <ConfirmDeleteDialog
        open={Boolean(pendingTaskDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingTaskDelete(null);
        }}
        title="Delete task?"
        description={
          <>
            This will permanently remove{" "}
            <DeleteEntityName>{pendingTaskDelete?.title ?? "this task"}</DeleteEntityName>. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete task"
        pending={deleteTask.isPending}
        onConfirm={() => {
          if (!pendingTaskDelete) return;
          deleteTask.mutate(pendingTaskDelete.id, {
            onSuccess: () => setPendingTaskDelete(null),
          });
        }}
      />
    </>
  );
}

function TaskCard({
  task,
  dragging,
  dropTarget,
  isReorderingColumns,
  members,
  onDragStart,
  onDragEnd,
  onDragOver,
  onEdit,
  onAssign,
  onPriorityChange,
  onDueDateChange,
  onDelete,
}: {
  task: ProjectTask;
  dragging: boolean;
  dropTarget: boolean;
  isReorderingColumns?: boolean;
  members: { id: number; name: string }[];
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onEdit: () => void;
  onAssign: (assigneeId: number | null) => void;
  onPriorityChange: (priority: string) => void;
  onDueDateChange: (dueDate: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <article
      draggable={!isReorderingColumns}
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          e.preventDefault();
          return;
        }
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (isReorderingColumns) return;
        e.preventDefault();
        e.stopPropagation();
        onDragOver();
      }}
      className={cn(
        "cursor-grab rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:cursor-grabbing",
        dragging && "rotate-2 scale-[1.03] shadow-lift",
        dropTarget && "border-primary/60 bg-primary-soft/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <TaskPriorityPicker priority={task.priority} onChange={onPriorityChange} />
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${task.title}`}
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${task.title}`}
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-bold leading-snug">{task.title}</h3>
      {task.description?.trim() && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
      )}
      {(task.subtasks_total ?? 0) > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <ListChecks className="size-3.5" />
            {task.subtasks_done ?? 0}/{task.subtasks_total}
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${Math.round(((task.subtasks_done ?? 0) / (task.subtasks_total || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <TaskDueDatePicker
          dueDate={task.due_date}
          column={task.column}
          onChange={onDueDateChange}
        />
        <TaskAssigneePicker assignee={task.assignee} members={members} onAssign={onAssign} />
      </div>
    </article>
  );
}
