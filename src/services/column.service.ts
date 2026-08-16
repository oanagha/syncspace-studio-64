import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";

export type BoardColumn = {
  id: number;
  project_id: number;
  title: string;
  name: string;
  color: string;
  position: number;
};

export type CreateColumnInput = {
  projectId: number;
  title: string;
  color?: string;
};

export type UpdateColumnInput = {
  title?: string;
  color?: string;
  position?: number;
};

export type ColumnOrderItem = {
  id: number;
  position: number;
};

export function columnQueryKey(projectId: number | string | null | undefined) {
  return ["columns", projectId ?? null] as const;
}

export function columnTitle(column: Pick<BoardColumn, "title" | "name">) {
  return column.title || column.name;
}

export async function listColumns(projectId: number) {
  return apiGet<{ columns: BoardColumn[] }>(`/api/columns?projectId=${projectId}`);
}

export async function createColumn(input: CreateColumnInput) {
  return apiPost<{ column: BoardColumn }>("/api/columns", input);
}

export async function updateColumn(columnId: number, input: UpdateColumnInput) {
  return apiPut<{ column: BoardColumn }>(`/api/columns/${columnId}`, input);
}

export async function reorderColumns(columns: ColumnOrderItem[]) {
  return apiPatch<{ columns: BoardColumn[] }>("/api/columns/reorder", { columns });
}

export type DeleteColumnResult = {
  message: string;
  deleted_column_id: number;
  moved_task_count: number;
  move_to_column_id: number | null;
  columns: BoardColumn[];
};

export async function deleteColumn(columnId: number, moveToColumnId?: number) {
  return apiDelete<DeleteColumnResult>(
    `/api/columns/${columnId}`,
    moveToColumnId ? { moveToColumnId } : undefined,
  );
}

export function applyColumnReorder(columns: BoardColumn[], draggedId: number, targetId: number) {
  const ordered = [...columns].sort((a, b) => a.position - b.position || a.id - b.id);
  const from = ordered.findIndex((column) => column.id === draggedId);
  const to = ordered.findIndex((column) => column.id === targetId);
  if (from < 0 || to < 0 || from === to) return null;

  const next = [...ordered];
  const [moved] = next.splice(from, 1);
  if (!moved) return null;
  next.splice(to, 0, moved);
  return next.map((column, position) => ({ ...column, position }));
}

export function applyColumnShift(columns: BoardColumn[], columnId: number, delta: -1 | 1) {
  const ordered = [...columns].sort((a, b) => a.position - b.position || a.id - b.id);
  const from = ordered.findIndex((column) => column.id === columnId);
  const target = ordered[from + delta];
  if (from < 0 || !target) return null;
  return applyColumnReorder(columns, columnId, target.id);
}

export function applyColumnUpdate(columns: BoardColumn[], updated: BoardColumn) {
  const current = columns.find((column) => column.id === updated.id);
  const from = current?.position ?? updated.position;
  const to = updated.position;

  return columns
    .map((column) => {
      if (column.id === updated.id) return updated;
      if (from < to && column.position > from && column.position <= to) {
        return { ...column, position: column.position - 1 };
      }
      if (from > to && column.position >= to && column.position < from) {
        return { ...column, position: column.position + 1 };
      }
      return column;
    })
    .sort((a, b) => a.position - b.position || a.id - b.id);
}
