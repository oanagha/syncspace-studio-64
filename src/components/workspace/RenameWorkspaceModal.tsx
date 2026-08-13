import { useEffect, useState } from "react";
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

type RenameWorkspaceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameWorkspaceModal({ open, onOpenChange }: RenameWorkspaceModalProps) {
  const { activeWorkspace, renameWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(activeWorkspace?.name ?? "");
      setSubmitting(false);
    }
  }, [open, activeWorkspace?.name]);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    onOpenChange(next);
  };

  const handleRename = async () => {
    if (!activeWorkspace) return;

    const trimmed = name.trim();

    if (!trimmed) {
      toast.error("Workspace name is required");
      return;
    }

    if (trimmed.length < MIN_NAME_LEN || trimmed.length > MAX_NAME_LEN) {
      toast.error(`Workspace name must be between ${MIN_NAME_LEN} and ${MAX_NAME_LEN} characters.`);
      return;
    }

    if (trimmed === activeWorkspace.name) {
      onOpenChange(false);
      return;
    }

    setSubmitting(true);
    try {
      const workspace = await renameWorkspace(activeWorkspace.id, trimmed);
      toast.success(`Workspace renamed to “${workspace.name}”`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename workspace.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
          <DialogDescription>This name is visible to everyone in the workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rename-ws-name">Workspace name</Label>
          <Input
            id="rename-ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleRename();
              }
            }}
            maxLength={MAX_NAME_LEN}
            disabled={submitting}
            className="h-11 rounded-2xl"
          />
        </div>
        <DialogFooter>
          <Button
            variant="hero"
            className="w-full sm:w-auto"
            onClick={() => void handleRename()}
            disabled={submitting || !activeWorkspace}
          >
            {submitting ? "Saving..." : "Save name"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
