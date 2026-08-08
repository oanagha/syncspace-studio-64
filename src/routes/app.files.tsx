import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CloudUpload, Grid2x2, List, MoreHorizontal, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { files, memberOf } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/files")({
  head: () => ({
    meta: [
      { title: "Files — SyncSpace Workspace" },
      { name: "description", content: "Drag-and-drop uploads, grid and list views, and shared file previews for every project in your workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragOver, setDragOver] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [uploads, setUploads] = useState<{ name: string; progress: number }[]>([
    { name: "sprint-14-recording.mp4", progress: 68 },
  ]);

  const simulateUpload = () => {
    const name = `design-export-${Math.floor(Math.random() * 90 + 10)}.zip`;
    setUploads((u) => [...u, { name, progress: 4 }]);
    const timer = setInterval(() => {
      setUploads((u) =>
        u.map((f) => (f.name === name ? { ...f, progress: Math.min(100, f.progress + 11) } : f)),
      );
    }, 320);
    setTimeout(() => clearInterval(timer), 3400);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Files</h1>
          <p className="text-sm text-muted-foreground">142 files · 63.4 GB of 1 TB used</p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-border p-1">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <Grid2x2 />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List />
          </Button>
        </div>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          simulateUpload();
        }}
        onClick={simulateUpload}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-12 text-center transition-all duration-300",
          dragOver && "scale-[1.01] border-primary bg-primary-soft/60",
        )}
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <CloudUpload className="size-6" />
        </span>
        <p className="mt-4 text-sm font-bold">Drop files here or click to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, PNG, FIG, MP4 and more · up to 5 GB per file
        </p>
      </div>

      {uploads.length > 0 && (
        <section className="surface-card space-y-4 p-5">
          <h2 className="text-sm font-bold">Uploading {uploads.length} file(s)</h2>
          {uploads.map((u) => (
            <div key={u.name} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{u.name}</span>
                <span className="shrink-0 text-muted-foreground">{u.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-brand transition-[width] duration-300"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {files.filter((f) => !hidden.includes(f.id)).map((f, i) => (
            <article
              key={f.id}
              onClick={() => toast(f.name, { description: `${f.kind} · ${f.size} · updated ${f.updated}` })}
              className="surface-card hover-lift cursor-pointer overflow-hidden"
              style={{ animation: `fade-up .5s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
            >
              <div
                className="grid h-32 place-items-center"
                style={{ background: `linear-gradient(135deg, ${f.color}22, ${f.color}08)` }}
              >
                <span className="rounded-2xl bg-card px-3 py-1.5 text-xs font-bold" style={{ color: f.color }}>
                  {f.kind}
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-bold">{f.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.size} · {memberOf(f.owner).name.split(" ")[0]} · {f.updated}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card divide-y divide-border overflow-hidden">
          {files.filter((f) => !hidden.includes(f.id)).map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
                style={{ background: `${f.color}1f`, color: f.color }}
              >
                {f.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.size} · {memberOf(f.owner).name} · {f.updated}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Download"
                onClick={() => toast.success(`Downloading ${f.name}`)}
              >
                <Download />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                  <DropdownMenuItem className="rounded-xl" onClick={() => toast.success("Share link copied")}>
                    Copy share link
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl" onClick={() => toast.success("Renaming coming from your team space")}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl text-destructive focus:text-destructive"
                    onClick={() => {
                      setHidden((h) => [...h, f.id]);
                      toast.success(`${f.name} moved to trash`);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
