import { apiGet } from "@/lib/api";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  task_id: number | null;
  workspace_id: number | null;
  unread: boolean;
  created_at: string;
};

export function notificationQueryKey() {
  return ["notifications"] as const;
}

export async function listNotifications() {
  return apiGet<{ notifications: AppNotification[]; unread_count: number }>(
    "/api/notifications",
  );
}

export function formatNotificationTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
