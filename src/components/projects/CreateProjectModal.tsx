import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { useWorkspace } from "@/hooks/useWorkspace";
import { createProject, PROJECT_COLORS } from "@/services/project.service";
import { cn } from "@/lib/utils";

type CreateProjectModalProps = {
  disabled?: boolean;
};

export function CreateProjectModal({ disabled }: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]!);
  const [deadline, setDeadline] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setColor(PROJECT_COLORS[0]!);
    setDeadline("");
  };

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      toast.success(`Project “${data.project.title}” created`);
      reset();
      setOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create project.");
    },
  });

  const submit = () => {
    if (!activeWorkspace) {
      toast.error("Select a workspace first.");
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("title is required");
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 150) {
      toast.error("title must be between 3 and 150 characters");
      return;
    }

    const payload: Parameters<typeof createProject>[0] = {
      workspaceId: activeWorkspace.id,
      title: trimmed,
      color,
    };
    const desc = description.trim();
    if (desc) payload.description = desc;
    if (deadline) payload.deadline = deadline;

    mutation.mutate(payload);
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
      <DialogTrigger asChild>
        <Button variant="hero" disabled={disabled || !activeWorkspace}>
          <Plus /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Projects hold boards, files and analytics for one stream of work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Helios Marketing Site"
              maxLength={150}
              className="h-11 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Website redesign for Helios Inc."
              className="rounded-2xl"
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
          <div className="space-y-2">
            <Label htmlFor="project-deadline">Deadline</Label>
            <Input
              id="project-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 rounded-2xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={mutation.isPending || !activeWorkspace}
          >
            {mutation.isPending ? "Creating..." : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
