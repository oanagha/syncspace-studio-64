import { apiGet } from "@/lib/api";
import type { BoardColumn } from "@/services/column.service";
import type { TaskSubtask } from "@/services/subtask.service";
import type { ProjectTask } from "@/services/task.service";

export type BoardAssignee = {
  id: number;
  name: string;
};

export type BoardActivityItem = {
  id: number;
  type: string;
  task_id: number;
  task_title: string;
  title: string;
  body: string;
  user: { id: number; name: string };
  created_at: string;
};

export type BoardActivity = {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  comments_count: number;
  watchers_count: number;
  subtasks_done: number;
  subtasks_total: number;
  recent: BoardActivityItem[];
};

export type BoardColumnWithCount = BoardColumn & {
  task_count?: number;
};

export type BoardTask = ProjectTask & {
  subtasks?: TaskSubtask[];
  comments_count?: number;
  watchers_count?: number;
};

export type BoardPayload = {
  project_id: number;
  columns: BoardColumnWithCount[];
  tasks: BoardTask[];
  assignees: BoardAssignee[];
  activity: BoardActivity;
};

export function boardQueryKey(projectId: number | string) {
  return ["board", Number(projectId)] as const;
}

export async function getBoard(projectId: number) {
  return apiGet<BoardPayload>(`/api/boards/${projectId}`);
}
