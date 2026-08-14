import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  PROJECT_COLORS,
  updateProject,
  type Project,
  type ProjectStatus,
} from "@/services/project.service";
import { cn } from "@/lib/utils";

type EditProjectModalProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  title: string;
  description: string;
  color: string;
  status: string;
  deadline: string;
};

function toFormState(project: Project): FormState {
  return {
    title: project.title,
    description: project.description ?? "",
    color: project.color || PROJECT_COLORS[0]!,
    status: project.status,
    deadline: project.deadline ?? "",
  };
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const [form, setForm] = useState<FormState>(() => toFormState(project));

  useEffect(() => {
    if (open) setForm(toFormState(project));
  }, [open, project]);

  const initial = useMemo(() => toFormState(project), [project]);
  const dirty =
    form.title !== initial.title ||
    form.description !== initial.description ||
    form.color !== initial.color ||
    form.status !== initial.status ||
    form.deadline !== initial.deadline;

  const mutation = useMutation({
    mutationFn: (payload: FormState) =>
      updateProject(project.id, {
        title: payload.title.trim(),
        description: payload.description.trim(),
        color: payload.color,
        status: payload.status as ProjectStatus,
        deadline: payload.deadline || null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["project", project.id], data);
      void queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      if (activeWorkspace?.id) {
        queryClient.setQueriesData(
          { queryKey: ["projects", activeWorkspace.id] },
          (current: { projects?: Project[] } | undefined) => {
            if (!current?.projects) return current;
            return {
              ...current,
              projects: current.projects.map((item) =>
                item.id === data.project.id ? { ...item, ...data.project } : item,
              ),
            };
          },
        );
        void queryClient.invalidateQueries({ queryKey: ["projects", activeWorkspace.id] });
      }
      toast.success(`Project “${data.project.title}” updated`);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update project.");
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    if (!next && dirty) {
      const discard = window.confirm("You have unsaved changes. Discard them?");
      if (!discard) return;
    }
    onOpenChange(next);
  };

  const submit = () => {
    const trimmed = form.title.trim();
    if (!trimmed) {
      toast.error("title is required");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 150) {
      toast.error("title must be between 3 and 150 characters");
      return;
    }
    mutation.mutate({ ...form, title: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl duration-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update details for this workspace project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-title">Title</Label>
            <Input
              id="edit-project-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={150}
              className="h-11 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea
              id="edit-project-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color: hex }))}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-110",
                    form.color === hex ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: hex }}
                  aria-label={`Color ${hex}`}
                  aria-pressed={form.color === hex}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-project-deadline">Deadline</Label>
            <Input
              id="edit-project-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              className="h-11 rounded-2xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={mutation.isPending || !dirty}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
