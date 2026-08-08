import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, MessageSquare, Paperclip, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { columns, memberOf, tasks as seedTasks, type Task } from "@/lib/data";
import { TaskDrawer } from "@/components/app/TaskDrawer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/board")({
  head: () => ({
    meta: [
      { title: "Kanban Board — SyncSpace Workspace" },
      { name: "description", content: "Drag tasks across Backlog, Todo, In Progress, Review and Done with priorities, assignees and subtask progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BoardPage,
});

const priorityStyle: Record<string, string> = {
  Urgent: "bg-destructive/12 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-primary-soft text-primary",
  Low: "bg-muted text-muted-foreground",
};

function BoardPage() {
  const [items, setItems] = useState<Task[]>(seedTasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [active, setActive] = useState<Task | null>(null);

  const move = (id: string, column: string) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Aurora Design System</h1>
          <p className="text-sm text-muted-foreground">Sprint 14 · 5 columns · {items.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden -space-x-2 sm:flex">
            {["u1", "u2", "u3", "u5"].map((id) => {
              const m = memberOf(id);
              return (
                <span
                  key={id}
                  className="grid size-9 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
              );
            })}
          </div>
          <Button variant="hero">
            <Plus /> Add task
          </Button>
        </div>
      </header>

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {columns.map((col) => {
          const colTasks = items.filter((t) => t.column === col);
          return (
            <section
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col);
              }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => {
                if (dragId) move(dragId, col);
                setDragId(null);
                setOverCol(null);
              }}
              className={cn(
                "w-[290px] shrink-0 snap-start rounded-3xl border border-border bg-card/60 p-3 transition-colors",
                overCol === col && "border-primary/50 bg-primary-soft/50",
              )}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="text-sm font-bold">{col}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.map((t, i) => {
                  const m = memberOf(t.assignee);
                  return (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setActive(t)}
                      style={{ animation: `pop .35s cubic-bezier(.22,1,.36,1) ${i * 50}ms both` }}
                      className={cn(
                        "cursor-grab rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:cursor-grabbing",
                        dragId === t.id && "rotate-2 scale-[1.03] shadow-lift",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            priorityStyle[t.priority],
                          )}
                        >
                          {t.priority}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {t.tag}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-bold leading-snug">{t.title}</h3>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="size-3.5" /> {t.subtasks[0]}/{t.subtasks[1]}
                        </span>
                        {t.attachments > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="size-3.5" /> {t.attachments}
                          </span>
                        )}
                        {t.comments > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3.5" /> {t.comments}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="size-3.5" /> {t.due}
                        </span>
                        <span
                          className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-primary-foreground"
                          style={{ background: m.color }}
                          title={m.name}
                        >
                          {m.initials}
                        </span>
                      </div>
                    </article>
                  );
                })}

                <button className="w-full rounded-2xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                  + Add card
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <TaskDrawer task={active} onClose={() => setActive(null)} />
    </div>
  );
}
