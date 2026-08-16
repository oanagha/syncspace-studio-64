import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { ApiRequestError } from "@/lib/api";
import {
  columnQueryKey,
  columnTitle,
  deleteColumn,
  type BoardColumn,
} from "@/services/column.service";
import { projectDetailQueryKey } from "@/services/project.service";
import { taskQueryKey, type ProjectTask } from "@/services/task.service";
import { cn } from "@/lib/utils";

type DeleteColumnModalProps = {
  projectId: number;
  column: BoardColumn | null;
  columns: BoardColumn[];
  taskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteColumnModal({
  projectId,
  column,
  columns,
  taskCount,
  open,
  onOpenChange,
}: DeleteColumnModalProps) {
  const queryClient = useQueryClient();
  const destinations = columns.filter((item) => item.id !== column?.id);
  const [moveToColumnId, setMoveToColumnId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setMoveToColumnId(destinations[0] ? String(destinations[0].id) : "");
  }, [open, column?.id, destinations[0]?.id]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!column) throw new Error("Column not found");
      if (columns.length <= 1) {
        throw new Error("Cannot delete the last remaining column");
      }
      if (taskCount > 0 && !moveToColumnId) {
        throw new Error("Choose a column to move these tasks into");
      }
      return deleteColumn(column.id, taskCount > 0 ? Number(moveToColumnId) : undefined);
    },
    onSuccess: (data) => {
      const removedTitle = column ? columnTitle(column) : "";
      const destination = destinations.find((item) => item.id === data.move_to_column_id);
      queryClient.setQueryData(columnQueryKey(projectId), { columns: data.columns });
      if (removedTitle && destination) {
        const nextTitle = columnTitle(destination);
        queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
          if (!current) return current;
          return {
            tasks: current.tasks.map((task) =>
              task.column === removedTitle ? { ...task, column: nextTitle } : task,
            ),
          };
        });
      }
      toast.success(
        data.moved_task_count > 0
          ? `Column deleted. ${data.moved_task_count} task${data.moved_task_count === 1 ? "" : "s"} moved.`
          : data.message,
      );
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to delete column.",
      );
    },
  });

  const title = column ? columnTitle(column) : "this column";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden border-border/70 p-0 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-destructive/[0.08] to-transparent" />

        <DialogHeader className="relative space-y-4 px-6 pb-2 pt-6 text-left">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/15">
            <Trash2 className="size-5" strokeWidth={2.25} />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight">Delete column?</DialogTitle>
            <DialogDescription className="text-[0.95rem] leading-relaxed">
              {taskCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">“{title}”</span> has {taskCount}{" "}
                  task{taskCount === 1 ? "" : "s"}. Choose where to move them before deleting.
                </>
              ) : (
                <>
                  Delete <span className="font-semibold text-foreground">“{title}”</span>? This
                  cannot be undone.
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        {taskCount > 0 && (
          <div className="relative space-y-2 px-6 pb-2">
            <Label>Move tasks to</Label>
            <Select value={moveToColumnId} onValueChange={setMoveToColumnId}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Choose a column" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {columnTitle(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter
          className={cn(
            "relative gap-2 border-t border-border/60 bg-muted/30 px-6 py-4 sm:space-x-0",
          )}
        >
          <Button
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="h-11 rounded-2xl"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !column || columns.length <= 1}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Working…
              </>
            ) : (
              "Delete column"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
