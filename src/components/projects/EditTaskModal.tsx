import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskAttachments } from "@/components/projects/TaskAttachments";
import { TaskComments } from "@/components/projects/TaskComments";
import { TaskSubtasks } from "@/components/projects/TaskSubtasks";
import { ConfirmDeleteDialog, DeleteEntityName } from "@/components/ux/ConfirmDeleteDialog";
import { useDeleteTask } from "@/hooks/useDeleteTask";
import { columnQueryKey, columnTitle, listColumns } from "@/services/column.service";
import { getProject, projectDetailQueryKey } from "@/services/project.service";
import {
  getTask,
  TASK_PRIORITIES,
  taskDetailQueryKey,
  unwatchTask,
  updateTask,
  watchTask,
  type ProjectTask,
} from "@/services/task.service";

type EditTaskModalProps = {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTaskModal({ task: initialTask, open, onOpenChange }: EditTaskModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [column, setColumn] = useState("Todo");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("none");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const taskQuery = useQuery({
    queryKey: taskDetailQueryKey(initialTask?.id ?? 0),
    queryFn: () => getTask(initialTask!.id),
    enabled: Boolean(open && initialTask?.id),
  });
  const task = taskQuery.data?.task ?? initialTask;

  const projectQuery = useQuery({
    queryKey: projectDetailQueryKey(task?.project_id ?? 0),
    queryFn: () => getProject(task!.project_id),
    enabled: Boolean(open && task?.project_id),
  });
  const columnsQuery = useQuery({
    queryKey: columnQueryKey(task?.project_id ?? 0),
    queryFn: () => listColumns(task!.project_id),
    enabled: Boolean(open && task?.project_id),
  });
  const members = projectQuery.data?.project.members ?? [];
  const columns = columnsQuery.data?.columns ?? [];
  const assigneeOptions =
    task?.assignee && !members.some((member) => member.id === task.assignee!.id)
      ? [...members, { id: task.assignee.id, name: task.assignee.name, avatar: null }]
      : members;

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setColumn(task.column);
    setPriority(task.priority);
    setDueDate(task.due_date ?? "");
    setAssigneeId(task.assignee_id ? String(task.assignee_id) : "none");
  }, [open, task]);

  const deleteMutation = useDeleteTask(task?.project_id ?? 0, () => onOpenChange(false));
  const watching = Boolean(task?.watching);

  const watchMutation = useMutation({
    mutationFn: () => {
      if (!task) throw new Error("Task not found");
      return watching ? unwatchTask(task.id) : watchTask(task.id);
    },
    onMutate: async () => {
      if (!task) return;
      const nextWatching = !watching;
      const key = taskDetailQueryKey(task.id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ task: ProjectTask }>(key);
      queryClient.setQueryData<{ task: ProjectTask }>(key, (current) => {
        const next = current?.task ?? task;
        return { task: { ...next, watching: nextWatching } };
      });
      return { previous, nextWatching };
    },
    onError: (err, _vars, context) => {
      if (task && context?.previous) {
        queryClient.setQueryData(taskDetailQueryKey(task.id), context.previous);
      }
      toast.error(
        err instanceof Error
          ? err.message
          : context?.nextWatching
            ? "Failed to watch task."
            : "Failed to unwatch task.",
      );
    },
    onSuccess: (data, _vars, context) => {
      if (!task) return;
      queryClient.setQueryData<{ task: ProjectTask }>(taskDetailQueryKey(task.id), (current) => {
        const next = current?.task ?? task;
        return { task: { ...next, watching: data.watching } };
      });
      toast.success(
        context?.nextWatching
          ? "You will receive notifications for this task."
          : "You will no longer receive notifications for this task.",
      );
    },
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!task) throw new Error("Task not found");
      const trimmed = title.trim();
      if (!trimmed) {
        throw new Error("Title cannot be empty");
      }
      return updateTask(task.id, {
        title: trimmed,
        description: description.trim(),
        columnId: column,
        assigneeId: assigneeId === "none" ? null : Number(assigneeId),
        priority,
        dueDate: dueDate || null,
      });
    },
    onSuccess: (data) => {
      toast.success(`Task “${data.task.title}” updated`);
      onOpenChange(false);
      const projectId = data.task.project_id;
      void queryClient.invalidateQueries({ queryKey: taskDetailQueryKey(data.task.id) });
      void queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update task.");
    },
  });

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Task title is required");
      return;
    }
    if (trimmed.length < 3) {
      toast.error("Task title must be at least 3 characters");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending || deleteMutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,820px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-0 border-b border-border/70 px-6 pb-4 pt-6 text-left">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-1.5">
              <DialogTitle>Edit task</DialogTitle>
              <DialogDescription>
                Update this task’s title, description, assignee, priority, or due date.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant={watching ? "secondary" : "outline"}
              size="sm"
              className="shrink-0"
              disabled={!task || watchMutation.isPending}
              onClick={() => watchMutation.mutate()}
            >
              {watchMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : watching ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {watching ? "Watching" : "Watch"}
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {taskQuery.isFetching && !taskQuery.data && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading task...
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Title</Label>
              <Input
                id="edit-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Write the homepage hero copy"
                maxLength={200}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What needs to be done?"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Column</Label>
                <Select value={column} onValueChange={setColumn}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[60]">
                    {columns.map((item) => (
                      <SelectItem key={item.id} value={columnTitle(item)}>
                        {columnTitle(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[60]">
                    {TASK_PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[60]">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {assigneeOptions.map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-due">Due date</Label>
                <Input
                  id="edit-task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>
            {task?.id ? <TaskSubtasks taskId={task.id} projectId={task.project_id} /> : null}
            {task?.id ? <TaskAttachments taskId={task.id} projectId={task.project_id} /> : null}
            {task?.id ? <TaskComments taskId={task.id} /> : null}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/70 bg-muted/25 px-6 py-4 sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={mutation.isPending || deleteMutation.isPending || !task}
            onClick={() => setDeleteOpen(true)}
          >
            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 />}
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={mutation.isPending || deleteMutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete task?"
        description={
          <>
            This will permanently remove{" "}
            <DeleteEntityName>{task?.title ?? "this task"}</DeleteEntityName> and its comments,
            subtasks, and attachments. This cannot be undone.
          </>
        }
        confirmLabel="Delete task"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!task) return;
          deleteMutation.mutate(task.id, {
            onSuccess: () => setDeleteOpen(false),
          });
        }}
      />
    </Dialog>
  );
}
