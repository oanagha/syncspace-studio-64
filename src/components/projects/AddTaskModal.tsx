import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTask,
  TASK_PRIORITIES,
  taskQueryKey,
  type ProjectTask,
} from "@/services/task.service";
import { columnQueryKey, columnTitle, listColumns } from "@/services/column.service";
import { getProject, projectDetailQueryKey } from "@/services/project.service";
import { boardQueryKey, type BoardPayload } from "@/services/board.service";

type AddTaskModalProps = {
  projectId: number;
  defaultColumn?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  showIcon?: boolean;
};

export function AddTaskModal({
  projectId,
  defaultColumn = "Todo",
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  showIcon = true,
}: AddTaskModalProps) {
  const queryClient = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [column, setColumn] = useState(defaultColumn);
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("none");

  const projectQuery = useQuery({
    queryKey: projectDetailQueryKey(projectId),
    queryFn: () => getProject(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0 && open,
  });
  const columnsQuery = useQuery({
    queryKey: columnQueryKey(projectId),
    queryFn: () => listColumns(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0 && open,
  });
  const members = projectQuery.data?.project.members ?? [];
  const columns = columnsQuery.data?.columns ?? [];

  useEffect(() => {
    if (open) setColumn(defaultColumn);
  }, [open, defaultColumn]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setColumn(defaultColumn);
    setPriority("Medium");
    setDueDate("");
    setAssigneeId("none");
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof createTask>[0] = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        columnId: column,
        assigneeId: assigneeId === "none" ? null : Number(assigneeId),
        priority,
      };
      if (dueDate) payload.dueDate = dueDate;
      return createTask(payload);
    },
    onSuccess: (data) => {
      const task = data.task;

      // Board keeps tasks in a disabled query seeded from getBoard — invalidate alone won't refetch.
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
        const existing = current?.tasks ?? [];
        if (existing.some((item) => item.id === task.id)) return { tasks: existing };
        return { tasks: [...existing, task] };
      });

      queryClient.setQueryData<BoardPayload>(boardQueryKey(projectId), (current) => {
        if (!current) return current;
        if (current.tasks.some((item) => item.id === task.id)) return current;
        const activity = current.activity
          ? {
              ...current.activity,
              total_tasks: current.activity.total_tasks + 1,
              in_progress_tasks:
                task.column === "In Progress"
                  ? current.activity.in_progress_tasks + 1
                  : current.activity.in_progress_tasks,
              completed_tasks:
                task.column === "Done"
                  ? current.activity.completed_tasks + 1
                  : current.activity.completed_tasks,
            }
          : current.activity;
        return { ...current, tasks: [...current.tasks, task], activity };
      });

      toast.success(`Task “${task.title}” added`);
      reset();
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create task.");
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
        if (mutation.isPending) return;
        if (!next) reset();
        setOpen(next);
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="hero">{showIcon && <Plus />} Add task</Button>
        </DialogTrigger>
      )}
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Tasks belong to this project and show up on its board.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
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
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
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
                <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mutation.isPending ? "Adding..." : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
