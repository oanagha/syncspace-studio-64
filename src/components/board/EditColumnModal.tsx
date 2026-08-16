import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  applyColumnUpdate,
  columnQueryKey,
  columnTitle,
  updateColumn,
  type BoardColumn,
} from "@/services/column.service";
import { PROJECT_COLORS } from "@/services/project.service";
import { taskQueryKey, type ProjectTask } from "@/services/task.service";

type EditColumnModalProps = {
  projectId: number;
  column: BoardColumn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditColumnModal({ projectId, column, open, onOpenChange }: EditColumnModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]!);

  useEffect(() => {
    if (!open || !column) return;
    setTitle(columnTitle(column));
    setColor(column.color || PROJECT_COLORS[0]!);
  }, [open, column]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!column) throw new Error("Column not found");
      const trimmed = title.trim();
      if (!trimmed) {
        throw new Error("Title cannot be empty");
      }
      return updateColumn(column.id, { title: trimmed, color });
    },
    onSuccess: (data) => {
      const previousTitle = column ? columnTitle(column) : "";
      queryClient.setQueryData<{ columns: BoardColumn[] }>(columnQueryKey(projectId), (current) => {
        if (!current) return { columns: [data.column] };
        return { columns: applyColumnUpdate(current.columns, data.column) };
      });
      if (previousTitle && previousTitle !== columnTitle(data.column)) {
        queryClient.setQueryData<{ tasks: ProjectTask[] }>(taskQueryKey(projectId), (current) => {
          if (!current) return current;
          return {
            tasks: current.tasks.map((task) =>
              task.column === previousTitle ? { ...task, column: columnTitle(data.column) } : task,
            ),
          };
        });
      }
      toast.success(`Column “${data.column.title}” updated`);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to update column.",
      );
    },
  });

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit column</DialogTitle>
          <DialogDescription>
            Update this column’s title or color. Changes show on the board immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-column-title">Title</Label>
            <Input
              id="edit-column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="In Progress"
              maxLength={50}
              className="h-11 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-110",
                    color === hex ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: hex }}
                  aria-label={`Color ${hex}`}
                  aria-pressed={color === hex}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={submit} disabled={mutation.isPending || !column}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save column"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
