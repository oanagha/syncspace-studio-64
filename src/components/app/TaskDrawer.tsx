import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Paperclip, Smile, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { comments, memberOf, type Task } from "@/lib/data";

const subtaskLabels = [
  "Map current column tokens",
  "Prototype drag physics",
  "Measure re-render cost",
  "Ship behind feature flag",
  "Write regression tests",
];

export function TaskDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  if (!task) return null;
  return <TaskDrawerBody task={task} onClose={onClose} />;
}

function TaskDrawerBody({ task, onClose }: { task: Task; onClose: () => void }) {
  const assignee = memberOf(task.assignee);
  const [extraSubtasks, setExtraSubtasks] = useState<string[]>([]);
  const [thread, setThread] = useState(comments.map((c) => ({ ...c, reactions: [...c.reactions] })));
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<string[]>([]);

  const addSubtask = () => {
    const label = window.prompt("New subtask");
    if (label && label.trim()) {
      setExtraSubtasks((p) => [...p, label.trim()]);
      toast.success("Subtask added");
    }
  };

  const postComment = () => {
    const body = draft.trim();
    if (!body) {
      toast.error("Write something first.");
      return;
    }
    setThread((prev) => [
      ...prev,
      { id: `c${Date.now()}`, user: "u1", time: "just now", body, reactions: [] as typeof prev[number]["reactions"] },
    ]);
    setDraft("");
    toast.success("Comment posted");
  };

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-border p-0 sm:max-w-xl"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border glass px-6 py-4">
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
            {task.tag}
          </span>
          <span className="text-xs text-muted-foreground">SYNC-{task.id.toUpperCase()}</span>
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="space-y-8 px-6 py-6">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">{task.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Profile the board under a 12-person realtime session and remove layout thrash while
              dragging. Target: 60fps on a 2019 MacBook Air with 150 cards loaded.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Status">
              <Select defaultValue={task.column}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Backlog", "Todo", "In Progress", "Review", "Done"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select defaultValue={task.priority}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Urgent"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assignee">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-border px-3">
                <span
                  className="grid size-6 place-items-center rounded-full text-[9px] font-bold text-primary-foreground"
                  style={{ background: assignee.color }}
                >
                  {assignee.initials}
                </span>
                <span className="truncate text-sm font-medium">{assignee.name}</span>
              </div>
            </Field>
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Checklist{" "}
                <span className="text-muted-foreground">
                  {task.subtasks[0]}/{task.subtasks[1]}
                </span>
              </h3>
              <button onClick={addSubtask} className="text-xs font-semibold text-primary hover:underline">
                Add item
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {[...subtaskLabels.slice(0, task.subtasks[1]), ...extraSubtasks].map((s, i) => (
                <li key={s} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
                  <Checkbox defaultChecked={i < task.subtasks[0]} />
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold">Attachments</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {["perf-trace.json", "board-profile.png"].slice(0, Math.max(1, task.attachments)).map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold">Comments</h3>
            <ul className="mt-4 space-y-5">
              {thread.map((c) => {
                const m = memberOf(c.user);
                return (
                  <li key={c.id} className="flex gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold text-primary-foreground"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <strong>{m.name}</strong>{" "}
                        <span className="text-xs text-muted-foreground">{c.time}</span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {c.reactions.map(([emoji, count]) => {
                          const key = `${c.id}${emoji}`;
                          const on = liked.includes(key);
                          return (
                            <button
                              key={emoji}
                              onClick={() =>
                                setLiked((p) => (on ? p.filter((x) => x !== key) : [...p, key]))
                              }
                              className={
                                on
                                  ? "rounded-full border border-primary bg-primary-soft px-2 py-0.5 text-xs text-primary transition-transform hover:scale-110"
                                  : "rounded-full border border-border px-2 py-0.5 text-xs transition-transform hover:scale-110"
                              }
                            >
                              {emoji} {Number(count) + (on ? 1 : 0)}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => toast("Reactions", { description: "Pick 👍 🎉 🚀 from the picker" })}
                          className="grid size-6 place-items-center rounded-full border border-border text-muted-foreground hover:text-primary"
                        >
                          <Smile className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && postComment()}
                placeholder="Write a comment, @mention a teammate…"
                className="h-11 rounded-2xl"
              />
              <Button variant="hero" className="h-11" onClick={postComment}>
                Send
              </Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold">Activity</h3>
            <ol className="mt-4 space-y-4 border-l border-border pl-5">
              {[
                ["Ava Mitchell created this task", "Aug 04"],
                ["Priority raised to Urgent", "Aug 09"],
                ["Moved to In Progress by Noah Bennett", "Aug 12"],
                ["3 subtasks completed", "Today"],
              ].map(([text, when]) => (
                <li key={text as string} className="relative">
                  <span className="absolute -left-[27px] top-1 grid size-4 place-items-center rounded-full bg-card">
                    <CheckCircle2 className="size-4 text-primary" />
                  </span>
                  <p className="text-sm">{text}</p>
                  <p className="text-xs text-muted-foreground">{when}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
