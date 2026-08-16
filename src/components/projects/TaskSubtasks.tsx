import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  createSubtask,
  deleteSubtask,
  listSubtasks,
  subtaskQueryKey,
  updateSubtask,
  type SubtaskListResponse,
  type TaskSubtask,
} from "@/services/subtask.service";
import { taskDetailQueryKey, taskQueryKey, type ProjectTask } from "@/services/task.service";

type TaskSubtasksProps = {
  taskId: number;
  projectId?: number;
};

function applySubtaskCounts(
  task: ProjectTask,
  done: number,
  total: number,
): ProjectTask {
  return { ...task, subtasks_done: done, subtasks_total: total };
}

function recount(items: TaskSubtask[]) {
  return {
    subtasks: items,
    subtasks_done: items.filter((item) => item.completed).length,
    subtasks_total: items.length,
  };
}

function SubtaskRow({
  item,
  busy,
  onToggle,
  onRename,
  onRemove,
}: {
  item: TaskSubtask;
  busy: boolean;
  onToggle: (completed: boolean) => void;
  onRename: (title: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(item.title);

  useEffect(() => {
    setDraft(item.title);
  }, [item.title]);

  const commitTitle = () => {
    const next = draft.trim();
    if (!next) {
      setDraft(item.title);
      toast.error("title is required");
      return;
    }
    if (next === item.title) return;
    onRename(next);
  };

  return (
    <li className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2">
      <Checkbox
        checked={item.completed}
        disabled={busy || item.id < 0}
        onCheckedChange={(value) => onToggle(value === true)}
        aria-label={item.completed ? `Mark "${item.title}" incomplete` : `Complete "${item.title}"`}
      />
      <Input
        value={draft}
        disabled={busy || item.id < 0}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(item.title);
            (e.target as HTMLInputElement).blur();
          }
        }}
        maxLength={200}
        className={`h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 ${
          item.completed ? "text-muted-foreground line-through" : ""
        }`}
        aria-label={`Edit "${item.title}"`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={busy || item.id < 0}
        aria-label={`Delete "${item.title}"`}
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

export function TaskSubtasks({ taskId, projectId }: TaskSubtasksProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const key = subtaskQueryKey(taskId);

  const subtasksQuery = useQuery({
    queryKey: key,
    queryFn: () => listSubtasks(taskId),
    enabled: Number.isInteger(taskId) && taskId > 0,
  });
  const subtasks = subtasksQuery.data?.subtasks ?? [];
  const done = subtasksQuery.data?.subtasks_done ?? subtasks.filter((item) => item.completed).length;
  const total = subtasksQuery.data?.subtasks_total ?? subtasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const syncCounts = (nextDone: number, nextTotal: number) => {
    queryClient.setQueryData<{ task: ProjectTask }>(taskDetailQueryKey(taskId), (current) => {
      if (!current?.task) return current;
      return { task: applySubtaskCounts(current.task, nextDone, nextTotal) };
    });
    if (projectId) {
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
        if (!current) return current;
        return {
          tasks: current.tasks.map((task) =>
            task.id === taskId ? applySubtaskCounts(task, nextDone, nextTotal) : task,
          ),
        };
      });
    }
  };

  const applyList = (next: SubtaskListResponse) => {
    queryClient.setQueryData(key, next);
    syncCounts(next.subtasks_done, next.subtasks_total);
  };

  const createMutation = useMutation({
    mutationFn: (text: string) => createSubtask(taskId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SubtaskListResponse>(key);
      const optimistic: TaskSubtask = {
        id: -Date.now(),
        task_id: taskId,
        title: text,
        completed: false,
        position: previous?.subtasks.length ?? 0,
      };
      applyList(recount([...(previous?.subtasks ?? []), optimistic]));
      setTitle("");
      return { previous };
    },
    onError: (err, _text, context) => {
      if (context?.previous) applyList(context.previous);
      toast.error(err instanceof Error ? err.message : "Failed to add checklist item.");
    },
    onSuccess: (data) => {
      const current = queryClient.getQueryData<SubtaskListResponse>(key);
      const withoutOptimistic = (current?.subtasks ?? []).filter((item) => item.id > 0);
      const next = withoutOptimistic.some((item) => item.id === data.subtask.id)
        ? withoutOptimistic
        : [...withoutOptimistic, data.subtask];
      applyList({
        subtasks: next,
        subtasks_done: data.subtasks_done,
        subtasks_total: data.subtasks_total,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      subtaskId,
      input,
    }: {
      subtaskId: number;
      input: { title?: string; completed?: boolean };
    }) => updateSubtask(taskId, subtaskId, input),
    onMutate: async ({ subtaskId, input }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SubtaskListResponse>(key);
      const nextItems = (previous?.subtasks ?? []).map((item) =>
        item.id === subtaskId ? { ...item, ...input } : item,
      );
      applyList(recount(nextItems));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) applyList(context.previous);
      toast.error(err instanceof Error ? err.message : "Failed to update checklist item.");
    },
    onSuccess: (data) => {
      const current = queryClient.getQueryData<SubtaskListResponse>(key);
      applyList({
        subtasks: (current?.subtasks ?? []).map((item) =>
          item.id === data.subtask.id ? data.subtask : item,
        ),
        subtasks_done: data.subtasks_done,
        subtasks_total: data.subtasks_total,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subtaskId: number) => deleteSubtask(taskId, subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SubtaskListResponse>(key);
      applyList(recount((previous?.subtasks ?? []).filter((item) => item.id !== subtaskId)));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) applyList(context.previous);
      toast.error(err instanceof Error ? err.message : "Failed to delete checklist item.");
    },
    onSuccess: (data) => {
      const current = queryClient.getQueryData<SubtaskListResponse>(key);
      applyList({
        subtasks: (current?.subtasks ?? []).filter((item) => item.id !== data.deleted_subtask_id),
        subtasks_done: data.subtasks_done,
        subtasks_total: data.subtasks_total,
      });
    },
  });

  const submit = () => {
    const text = title.trim();
    if (!text) {
      toast.error("title is required");
      return;
    }
    createMutation.mutate(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="inline-flex items-center gap-2">
          <ListChecks className="size-4 text-muted-foreground" />
          Checklist
        </Label>
        <span className="text-xs font-semibold text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
      {subtasksQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading checklist…
        </p>
      ) : (
        <ul className="space-y-2">
          {subtasks.map((item) => (
            <SubtaskRow
              key={item.id}
              item={item}
              busy={updateMutation.isPending || deleteMutation.isPending}
              onToggle={(completed) =>
                updateMutation.mutate({ subtaskId: item.id, input: { completed } })
              }
              onRename={(nextTitle) =>
                updateMutation.mutate({ subtaskId: item.id, input: { title: nextTitle } })
              }
              onRemove={() => deleteMutation.mutate(item.id)}
            />
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a checklist item"
          maxLength={200}
          className="h-10 rounded-2xl"
        />
        <Button type="button" variant="outline" onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </div>
    </div>
  );
}
