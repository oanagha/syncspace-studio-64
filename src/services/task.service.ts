import { apiGet, apiPost, apiPut } from "@/lib/api";

export const TASK_COLUMNS = ["Backlog", "Todo", "In Progress", "Review", "Done"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type TaskColumn = (typeof TASK_COLUMNS)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type ProjectTask = {
  id: number;
  project_id: number;
  title: string;
  description: string;
  column: string;
  priority: string;
  due_date: string | null;
  created_by: number;
  created_at?: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  column?: string;
  priority?: string;
  due_date?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  column?: string;
  priority?: string;
  due_date?: string | null;
};

export function taskQueryKey(projectId: number | string) {
  return ["tasks", Number(projectId)] as const;
}

export async function listTasks(projectId: number) {
  return apiGet<{ tasks: ProjectTask[] }>(`/api/projects/${projectId}/tasks`);
}

export async function createTask(projectId: number, input: CreateTaskInput) {
  return apiPost<{ task: ProjectTask }>(`/api/projects/${projectId}/tasks`, input);
}

export async function updateTask(taskId: number, input: UpdateTaskInput) {
  return apiPut<{ task: ProjectTask }>(`/api/tasks/${taskId}`, input);
}

export async function updateTaskColumn(taskId: number, column: string) {
  return updateTask(taskId, { column });
}
