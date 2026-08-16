import { apiDelete, apiGet, apiUploadFormData, getApiOrigin } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type WorkspaceFile = {
  id: number;
  name: string;
  size: number;
  size_bytes: number;
  mime_type: string;
  kind: string;
  color: string;
  uploaded_by: { id: number; name: string } | null;
  project_id: number | null;
  project_title: string | null;
  task_id: number | null;
  task_title: string | null;
  workspace_id: number;
  created_at: string;
  download_url: string;
};

export type FilesListResponse = {
  files: WorkspaceFile[];
  file_count: number;
  total_size: number;
};

export function filesQueryKey(workspaceId: number | null | undefined) {
  return ["files", workspaceId ?? null] as const;
}

export function taskAttachmentsQueryKey(
  workspaceId: number | null | undefined,
  taskId: number | null | undefined,
) {
  return ["task-attachments", workspaceId ?? null, taskId ?? null] as const;
}

export async function listFiles(workspaceId: number, options?: { taskId?: number }) {
  const params = new URLSearchParams();
  params.set("workspaceId", String(workspaceId));
  if (options?.taskId) {
    params.set("taskId", String(options.taskId));
  }
  return apiGet<FilesListResponse>(`/api/files?${params.toString()}`);
}

export async function listTaskAttachments(workspaceId: number, taskId: number) {
  return listFiles(workspaceId, { taskId });
}

export async function uploadFile(input: {
  file: File;
  workspaceId: number;
  projectId?: number;
  taskId?: number;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("workspaceId", String(input.workspaceId));
  if (input.projectId) formData.append("projectId", String(input.projectId));
  if (input.taskId) formData.append("taskId", String(input.taskId));
  return apiUploadFormData<{ file: WorkspaceFile }>("/api/files", formData);
}

export async function deleteFile(fileId: number) {
  return apiDelete<{ message: string }>(`/api/files/${fileId}`);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function formatFileDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Authenticated download via fetch + blob (Bearer token). */
export async function downloadWorkspaceFile(file: WorkspaceFile) {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${getApiOrigin()}${file.download_url}`, {
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    let message = "Download failed";
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const MAX_UPLOAD_HINT = "PDF, PNG, FIG, MP4 and more · up to 50 MB per file";
