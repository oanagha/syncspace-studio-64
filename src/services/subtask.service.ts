import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export type TaskSubtask = {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at?: string;
};

export type SubtaskListResponse = {
  subtasks: TaskSubtask[];
  subtasks_done: number;
  subtasks_total: number;
};

export type CreateSubtaskResponse = {
  subtask: TaskSubtask;
  subtasks_done: number;
  subtasks_total: number;
};

export function subtaskQueryKey(taskId: number | string) {
  return ["task-subtasks", Number(taskId)] as const;
}

export async function listSubtasks(taskId: number) {
  return apiGet<SubtaskListResponse>(`/api/tasks/${taskId}/subtasks`);
}

export async function createSubtask(taskId: number, title: string) {
  return apiPost<CreateSubtaskResponse>(`/api/tasks/${taskId}/subtasks`, { title });
}

export type UpdateSubtaskInput = {
  title?: string;
  completed?: boolean;
};

export type UpdateSubtaskResponse = {
  subtask: TaskSubtask;
  subtasks_done: number;
  subtasks_total: number;
};

export async function updateSubtask(
  taskId: number,
  subtaskId: number,
  input: UpdateSubtaskInput,
) {
  return apiPatch<UpdateSubtaskResponse>(
    `/api/tasks/${taskId}/subtasks/${subtaskId}`,
    input,
  );
}

export async function deleteSubtask(taskId: number, subtaskId: number) {
  return apiDelete<{
    message: string;
    deleted_subtask_id: number;
    subtasks_done: number;
    subtasks_total: number;
  }>(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
}
