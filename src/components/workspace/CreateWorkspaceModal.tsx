import { useState } from "react";
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
import { useWorkspace } from "@/hooks/useWorkspace";

const MIN_NAME_LEN = 3;
const MAX_NAME_LEN = 100;

type CreateWorkspaceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error("Give your workspace a name first.");
      return;
    }

    if (trimmed.length < MIN_NAME_LEN || trimmed.length > MAX_NAME_LEN) {
      toast.error(`Workspace name must be between ${MIN_NAME_LEN} and ${MAX_NAME_LEN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const workspace = await createWorkspace(trimmed);
      toast.success(`Workspace “${workspace.name}” created`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
          <DialogDescription>
            Workspaces keep projects, files and members of one team together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ws-name">Workspace name</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
            placeholder="Northwind Studio"
            maxLength={MAX_NAME_LEN}
            disabled={submitting}
            className="h-11 rounded-2xl"
          />
        </div>
        <DialogFooter>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={() => void handleCreate()}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
