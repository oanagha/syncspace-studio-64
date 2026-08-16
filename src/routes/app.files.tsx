import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Download, Grid2x2, List, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ConfirmDeleteDialog, DeleteEntityName } from "@/components/ux/ConfirmDeleteDialog";
import {
  deleteFile,
  downloadWorkspaceFile,
  filesQueryKey,
  formatBytes,
  formatFileDate,
  listFiles,
  MAX_UPLOAD_HINT,
  uploadFile,
  type WorkspaceFile,
} from "@/services/file.service";

export const Route = createFileRoute("/app/files")({
  head: () => ({
    meta: [
      { title: "Files — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Drag-and-drop uploads, grid and list views, and shared file previews for every project in your workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FilesPage,
});

const STORAGE_CAP_BYTES = 1024 ** 4; // 1 TB plan display

function FilesPage() {
  const queryClient = useQueryClient();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragOver, setDragOver] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WorkspaceFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filesQuery = useQuery({
    queryKey: filesQueryKey(workspaceId),
    queryFn: () => listFiles(workspaceId!),
    enabled: Number.isInteger(workspaceId) && (workspaceId ?? 0) > 0,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      if (!workspaceId) throw new Error("Select a workspace first.");
      return uploadFile({ file, workspaceId });
    },
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.file.name}`);
      void queryClient.invalidateQueries({ queryKey: filesQueryKey(workspaceId) });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error ? err.message : "Upload failed.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (file: WorkspaceFile) => deleteFile(file.id),
    onSuccess: (_data, file) => {
      toast.success(`${file.name} deleted`);
      void queryClient.invalidateQueries({ queryKey: filesQueryKey(workspaceId) });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error ? err.message : "Delete failed.",
      );
    },
  });

  const handleFiles = (list: FileList | File[] | null) => {
    if (!list || uploadMutation.isPending) return;
    const files = Array.from(list);
    if (files.length === 0) return;
    // Upload sequentially to keep UI simple and avoid flooding
    void (async () => {
      for (const file of files) {
        try {
          await uploadMutation.mutateAsync(file);
        } catch {
          // error toast already shown
        }
      }
      if (inputRef.current) inputRef.current.value = "";
    })();
  };

  const onDownload = async (file: WorkspaceFile) => {
    try {
      await downloadWorkspaceFile(file);
      toast.success(`Downloading ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const onDelete = (file: WorkspaceFile) => {
    setPendingDelete(file);
  };

  if (workspaceLoading || filesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Select a workspace</h1>
        <p className="text-sm text-muted-foreground">Files are scoped to the active workspace.</p>
      </div>
    );
  }

  if (filesQuery.isError) {
    const err = filesQuery.error;
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Couldn’t load files</h1>
        <p className="text-sm text-muted-foreground">
          {err instanceof ApiRequestError || err instanceof Error
            ? err.message
            : "Failed to process file"}
        </p>
        <Button variant="outline" onClick={() => void filesQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const files = filesQuery.data?.files ?? [];
  const fileCount = filesQuery.data?.file_count ?? files.length;
  const totalSize = filesQuery.data?.total_size ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Files</h1>
          <p className="text-sm text-muted-foreground">
            {fileCount} file{fileCount === 1 ? "" : "s"} · {formatBytes(totalSize)} of{" "}
            {formatBytes(STORAGE_CAP_BYTES)} used
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-border p-1">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <Grid2x2 />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List />
          </Button>
        </div>
      </header>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!uploadMutation.isPending) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!uploadMutation.isPending) inputRef.current?.click();
        }}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-12 text-center transition-all duration-300",
          dragOver && "scale-[1.01] border-primary bg-primary-soft/60",
          uploadMutation.isPending && "pointer-events-none opacity-70",
        )}
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <CloudUpload className="size-6" />
        </span>
        <p className="mt-4 text-sm font-bold">
          {uploadMutation.isPending ? "Uploading…" : "Drop files here or click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{MAX_UPLOAD_HINT}</p>
      </div>

      {uploadMutation.isPending && (
        <section className="surface-card space-y-3 p-5">
          <h2 className="text-sm font-bold">Uploading…</h2>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full gradient-brand" />
          </div>
        </section>
      )}

      {files.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm font-semibold">No files yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload a file to get started.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f, i) => (
            <article
              key={f.id}
              className="surface-card hover-lift overflow-hidden"
              style={{
                animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 20, 100)}ms both`,
              }}
            >
              <div
                className="grid h-32 place-items-center"
                style={{ background: `linear-gradient(135deg, ${f.color}22, ${f.color}08)` }}
              >
                <span
                  className="rounded-2xl bg-card px-3 py-1.5 text-xs font-bold"
                  style={{ color: f.color }}
                >
                  {f.kind}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-bold">{f.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(f.size_bytes)} · {f.uploaded_by?.name.split(" ")[0] || "Unknown"} ·{" "}
                    {formatFileDate(f.created_at)}
                  </p>
                  {(f.project_title || f.task_title) && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {[f.project_title, f.task_title].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${f.name}`}
                    onClick={() => void onDownload(f)}
                  >
                    <Download />
                  </Button>
                  <FileMenu
                    file={f}
                    onDownload={() => void onDownload(f)}
                    onDelete={() => onDelete(f)}
                    deleting={deleteMutation.isPending && deleteMutation.variables?.id === f.id}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card divide-y divide-border overflow-hidden">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
                style={{ background: `${f.color}1f`, color: f.color }}
              >
                {f.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.size_bytes)} · {f.uploaded_by?.name || "Unknown"} ·{" "}
                  {formatFileDate(f.created_at)}
                  {f.project_title ? ` · ${f.project_title}` : ""}
                  {f.task_title ? ` · ${f.task_title}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Download ${f.name}`}
                onClick={() => void onDownload(f)}
              >
                <Download />
              </Button>
              <FileMenu
                file={f}
                onDownload={() => void onDownload(f)}
                onDelete={() => onDelete(f)}
                deleting={deleteMutation.isPending && deleteMutation.variables?.id === f.id}
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete file?"
        description={
          <>
            <DeleteEntityName>{pendingDelete?.name ?? "This file"}</DeleteEntityName> will be
            permanently removed from this workspace. This cannot be undone.
          </>
        }
        confirmLabel="Delete file"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
}

function FileMenu({
  file,
  onDownload,
  onDelete,
  deleting,
}: {
  file: WorkspaceFile;
  onDownload: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More for ${file.name}`}
          disabled={deleting}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl">
        <DropdownMenuItem className="rounded-xl" onClick={onDownload}>
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-xl"
          onClick={() => {
            void navigator.clipboard.writeText(file.download_url);
            toast.success("Download path copied");
          }}
        >
          Copy download path
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl text-destructive focus:text-destructive"
          disabled={Boolean(deleting)}
          onClick={onDelete}
        >
          {deleting ? "Deleting…" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
