import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export type TaskCommentUser = {
  id: number;
  name: string;
};

export type TaskComment = {
  id: number;
  task_id: number;
  content: string;
  user: TaskCommentUser;
  created_at: string;
};

export function commentQueryKey(taskId: number | string) {
  return ["task-comments", Number(taskId)] as const;
}

export async function listComments(taskId: number) {
  return apiGet<{ comments: TaskComment[] }>(`/api/tasks/${taskId}/comments`);
}

export async function createComment(taskId: number, content: string) {
  return apiPost<{ comment: TaskComment }>(`/api/tasks/${taskId}/comments`, { content });
}

export async function updateComment(taskId: number, commentId: number, content: string) {
  return apiPatch<{ comment: TaskComment }>(`/api/tasks/${taskId}/comments/${commentId}`, {
    content,
  });
}

export async function deleteComment(taskId: number, commentId: number) {
  return apiDelete<{ message: string; id: number }>(
    `/api/tasks/${taskId}/comments/${commentId}`,
  );
}

export function formatCommentTime(value?: string) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
