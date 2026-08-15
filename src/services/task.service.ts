import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";

export const TASK_COLUMNS = ["Backlog", "Todo", "In Progress", "Review", "Done"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type TaskColumn = (typeof TASK_COLUMNS)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskAssignee = {
  id: number;
  name: string;
};

export type ProjectTask = {
  id: number;
  project_id: number;
  title: string;
  description: string;
  column: string;
  priority: string;
  due_date: string | null;
  assignee_id: number | null;
  assignee: TaskAssignee | null;
  order?: number;
  created_by: number;
  created_at?: string;
  subtasks_done?: number;
  subtasks_total?: number;
  watching?: boolean;
  comments_count?: number;
  watchers_count?: number;
};

export type CreateTaskInput = {
  projectId: number;
  title: string;
  description?: string;
  columnId?: string;
  assigneeId?: number | null;
  priority?: string;
  dueDate?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  column?: string;
  columnId?: string;
  assigneeId?: number | null;
  priority?: string;
  dueDate?: string | null;
  due_date?: string | null;
};

export function taskQueryKey(projectId: number | string) {
  return ["tasks", Number(projectId)] as const;
}

export function taskDetailQueryKey(taskId: number | string) {
  return ["task", Number(taskId)] as const;
}

export async function listTasks(projectId: number) {
  return apiGet<{ tasks: ProjectTask[] }>(`/api/projects/${projectId}/tasks`);
}

export async function getTask(taskId: number) {
  return apiGet<{ task: ProjectTask }>(`/api/tasks/${taskId}`);
}

export type WatchTaskResponse = {
  watching: boolean;
  task_id: number;
  user_id: number;
  created_at: string | null;
  watchers_count: number;
};

export async function watchTask(taskId: number) {
  return apiPost<WatchTaskResponse>(`/api/tasks/${taskId}/watch`, {});
}

export async function unwatchTask(taskId: number) {
  return apiDelete<WatchTaskResponse>(`/api/tasks/${taskId}/unwatch`);
}

export async function createTask(input: CreateTaskInput) {
  return apiPost<{ task: ProjectTask }>("/api/tasks", input);
}

export async function updateTask(taskId: number, input: UpdateTaskInput) {
  return apiPut<{ task: ProjectTask }>(`/api/tasks/${taskId}`, input);
}

export type UpdateTaskStatusInput = {
  columnId: string;
  order?: number;
};

export async function deleteTask(taskId: number) {
  return apiDelete<{ message: string; id: number }>(`/api/tasks/${taskId}`);
}

export async function assignTask(taskId: number, assigneeId: number | null) {
  return apiPatch<{ task: ProjectTask }>(`/api/tasks/${taskId}/assign`, { assigneeId });
}

export async function updateTaskPriority(taskId: number, priority: string) {
  return apiPatch<{ task: ProjectTask; priority: string }>(`/api/tasks/${taskId}/priority`, {
    priority,
  });
}

export async function updateTaskDueDate(taskId: number, dueDate: string | null) {
  return apiPatch<{ task: ProjectTask }>(`/api/tasks/${taskId}/due-date`, { dueDate });
}

export function applyTaskPatch(
  tasks: ProjectTask[],
  taskId: number,
  patch: Partial<ProjectTask>,
) {
  return tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
}

export function isTaskOverdue(task: Pick<ProjectTask, "due_date" | "column">) {
  if (!task.due_date || task.column === "Done") return false;
  const due = new Date(`${task.due_date}T00:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function todayDateInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function applyTaskAssignee(
  tasks: ProjectTask[],
  taskId: number,
  assignee: TaskAssignee | null,
) {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, assignee_id: assignee?.id ?? null, assignee }
      : task,
  );
}

export async function updateTaskStatus(taskId: number, input: UpdateTaskStatusInput) {
  return apiPatch<{
    task: ProjectTask;
    status: { columnId: string; order: number };
  }>(`/api/tasks/${taskId}/status`, input);
}

export function applyTaskMove(
  tasks: ProjectTask[],
  taskId: number,
  columnId: string,
  order: number,
) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return tasks;

  const others = tasks.filter((item) => item.id !== taskId);
  const target = others
    .filter((item) => item.column === columnId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const rest = others.filter((item) => item.column !== columnId);
  const nextOrder = Math.max(0, Math.min(order, target.length));
  target.splice(nextOrder, 0, { ...task, column: columnId });

  return [
    ...rest,
    ...target.map((item, index) => ({ ...item, order: index })),
  ];
}
