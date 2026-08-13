import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { ProgressRing } from "@/components/ux/motion";
import { memberOf, projects as seedProjects } from "@/lib/data";
import { useWorkspace } from "@/hooks/useWorkspace";

type Project = (typeof seedProjects)[number];

export const Route = createFileRoute("/app/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SyncSpace Workspace" },
      { name: "description", content: "Browse every workspace project with live progress rings, owners, deadlines and health status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("progress");
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const workspaceName = activeWorkspace?.name || "this workspace";

  const addProject = (p: Project) => setProjects((prev) => [p, ...prev]);

  const list = projects
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "progress" ? b.progress - a.progress : a.name.localeCompare(b.name),
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} active projects across {workspaceName}
          </p>
        </div>
        <CreateProjectModal onCreate={addProject} workspaceName={workspaceName} />
      </header>

      <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="h-11 rounded-2xl pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="On track">On track</SelectItem>
            <SelectItem value="At risk">At risk</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-44">
            <SlidersHorizontal className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="progress">Sort by progress</SelectItem>
            <SelectItem value="name">Sort by name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <Link
            key={p.id}
            to="/app/board"
            className="surface-card hover-lift block p-6"
            style={{ animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 20, 100)}ms both` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: `${p.accent}1f`, color: p.accent }}
                >
                  {p.status}
                </span>
                <h2 className="mt-3 truncate text-lg font-bold">{p.name}</h2>
                <p className="text-sm text-muted-foreground">{p.client}</p>
              </div>
              <ProgressRing value={p.progress} color={p.accent} />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex -space-x-2">
                {p.members.map((id) => {
                  const m = memberOf(id);
                  return (
                    <span
                      key={id}
                      title={m.name}
                      className="grid size-8 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                  );
                })}
                <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                  +2
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.done}/{p.tasks} tasks · due {p.due}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateProjectModal({
  onCreate,
  workspaceName,
}: {
  onCreate: (p: Project) => void;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [due, setDue] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the project a name first.");
      return;
    }
    onCreate({
      id: `p${Date.now()}`,
      name: name.trim(),
      client: client.trim() || workspaceName,
      progress: 0,
      tasks: 0,
      done: 0,
      due: due || "TBD",
      status: "Planning",
      members: ["u1", "u2"],
      accent: "#2D8A9E",
    });
    setName("");
    setClient("");
    setDue("");
    setOpen(false);
    toast.success("Project created");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Projects hold boards, files and analytics for one stream of work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pn">Project name</Label>
            <Input
              id="pn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Aurora Design System"
              className="h-11 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pc">Client</Label>
            <Input
              id="pc"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder={workspaceName}
              className="h-11 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pd">Description</Label>
            <Textarea id="pd" rows={3} placeholder="What is this project for?" className="rounded-2xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select defaultValue="kanban">
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kanban">Kanban sprint</SelectItem>
                  <SelectItem value="design">Design pipeline</SelectItem>
                  <SelectItem value="launch">Product launch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dd">Target date</Label>
              <Input
                id="dd"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero" className="w-full sm:w-auto" onClick={submit}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
