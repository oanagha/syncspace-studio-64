import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ConfirmDeleteDialog,
  DeleteEntityName,
} from "@/components/ux/ConfirmDeleteDialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ApiRequestError } from "@/lib/api";
import {
  deleteFile,
  downloadWorkspaceFile,
  filesQueryKey,
  formatBytes,
  formatFileDate,
  listTaskAttachments,
  MAX_UPLOAD_HINT,
  taskAttachmentsQueryKey,
  uploadFile,
  type WorkspaceFile,
} from "@/services/file.service";

type TaskAttachmentsProps = {
  taskId: number;
  projectId?: number | null;
};

export function TaskAttachments({ taskId, projectId }: TaskAttachmentsProps) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkspaceFile | null>(null);

  const attachmentsQuery = useQuery({
    queryKey: taskAttachmentsQueryKey(workspaceId, taskId),
    queryFn: () => listTaskAttachments(workspaceId!, taskId),
    enabled: Number.isInteger(workspaceId) && Number.isInteger(taskId) && taskId > 0,
  });

  const files = attachmentsQuery.data?.files ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: taskAttachmentsQueryKey(workspaceId, taskId) }),
      queryClient.invalidateQueries({ queryKey: filesQueryKey(workspaceId) }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      if (!workspaceId) throw new Error("Select a workspace first.");
      return uploadFile({
        file,
        workspaceId,
        taskId,
        ...(projectId ? { projectId } : {}),
      });
    },
    onSuccess: async (data) => {
      toast.success(`Attached “${data.file.name}”`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to upload attachment.",
      );
    },
    onSettled: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => deleteFile(fileId),
    onSuccess: async () => {
      toast.success("Attachment deleted");
      await invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to delete attachment.",
      );
    },
  });

  const onPick = (file: File | undefined) => {
    if (!file || uploadMutation.isPending) return;
    uploadMutation.mutate(file);
  };

  const onDownload = async (file: WorkspaceFile) => {
    try {
      await downloadWorkspaceFile(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const onDelete = (file: WorkspaceFile) => {
    if (deleteMutation.isPending) return;
    setPendingDelete(file);
  };

  const busy = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">Attachments</p>
          <p className="text-xs text-muted-foreground">{MAX_UPLOAD_HINT}</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => onPick(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!workspaceId || busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploadMutation.isPending ? "Uploading…" : "Attach file"}
          </Button>
        </div>
      </div>

      {!workspaceId && (
        <p className="text-sm text-muted-foreground">Select a workspace to manage attachments.</p>
      )}

      {workspaceId && attachmentsQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading attachments…
        </div>
      )}

      {workspaceId && !attachmentsQuery.isLoading && files.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
          <Paperclip className="size-4" />
          No attachments yet.
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => {
            const deleting = deleteMutation.isPending && deleteMutation.variables === file.id;
            return (
              <li
                key={file.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/80 px-3 py-2.5"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-primary-foreground"
                  style={{ background: file.color }}
                >
                  {file.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.kind} · {formatBytes(file.size_bytes)} · {formatFileDate(file.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${file.name}`}
                    disabled={busy}
                    onClick={() => void onDownload(file)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${file.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={busy}
                    onClick={() => onDelete(file)}
                  >
                    {deleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete attachment?"
        description={
          <>
            <DeleteEntityName>{pendingDelete?.name ?? "This file"}</DeleteEntityName> will be
            removed from this task and the workspace files library.
          </>
        }
        confirmLabel="Delete attachment"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
}
