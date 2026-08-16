import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
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
  columnQueryKey,
  createColumn,
  type BoardColumn,
} from "@/services/column.service";
import { PROJECT_COLORS } from "@/services/project.service";

type AddColumnModalProps = {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddColumnModal({ projectId, open, onOpenChange }: AddColumnModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]!);

  const reset = () => {
    setTitle("");
    setColor(PROJECT_COLORS[0]!);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createColumn({
        projectId,
        title: title.trim(),
        color,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<{ columns: BoardColumn[] }>(columnQueryKey(projectId), (current) => {
        const existing = current?.columns ?? [];
        if (existing.some((column) => column.id === data.column.id)) {
          return { columns: existing };
        }
        return { columns: [...existing, data.column] };
      });
      toast.success(`Column “${data.column.title}” added`);
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to create column.",
      );
    },
  });

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("title is required");
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
        onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a column</DialogTitle>
          <DialogDescription>
            New columns show up at the end of this project’s board.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-title">Title</Label>
            <Input
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Blocked"
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
          <Button variant="hero" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus /> Add column
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
