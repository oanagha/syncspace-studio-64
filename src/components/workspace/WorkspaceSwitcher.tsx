import { useState } from "react";
import { Check, ChevronsUpDown, Pencil, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { canRenameWorkspace, workspaceInitials, type WorkspaceRole } from "@/services/workspace.service";
import { cn } from "@/lib/utils";
import { RenameWorkspaceModal } from "@/components/workspace/RenameWorkspaceModal";

type WorkspaceSwitcherProps = {
  collapsed?: boolean;
  onCreateWorkspace: () => void;
};

function roleBadgeVariant(role: WorkspaceRole) {
  if (role === "Owner") return "default" as const;
  if (role === "Admin") return "secondary" as const;
  return "outline" as const;
}

export function WorkspaceSwitcher({ collapsed, onCreateWorkspace }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, loading, switching, switchWorkspace } = useWorkspace();
  const [renameOpen, setRenameOpen] = useState(false);

  const initials = workspaceInitials(activeWorkspace?.name || "WS");
  const showRename = canRenameWorkspace(activeWorkspace?.role);

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-sidebar-border p-2.5 text-left transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center",
          )}
          disabled={loading || switching}
          aria-label="Switch workspace"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-brand text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {loading && !activeWorkspace ? "Loading…" : activeWorkspace?.name || "No workspace"}
                </span>
                {activeWorkspace?.role && (
                  <span className="mt-0.5 inline-flex">
                    <Badge
                      variant={roleBadgeVariant(activeWorkspace.role)}
                      className="h-5 rounded-md px-1.5 text-[10px] uppercase tracking-wide"
                    >
                      {activeWorkspace.role}
                    </Badge>
                  </span>
                )}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72 rounded-2xl p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
      >
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">No workspaces yet.</p>
        )}
        {workspaces.map((workspace) => {
          const active = workspace.id === activeWorkspace?.id;
          return (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => {
                if (!active) void switchWorkspace(workspace.id);
              }}
              className={cn(
                "gap-3 rounded-xl",
                active && "bg-primary-soft text-foreground",
              )}
            >
              <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-[10px] font-bold text-primary">
                {workspaceInitials(workspace.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{workspace.name}</span>
                <Badge
                  variant={roleBadgeVariant(workspace.role)}
                  className="mt-0.5 h-4 rounded px-1 text-[9px] uppercase tracking-wide"
                >
                  {workspace.role}
                </Badge>
              </span>
              {active && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {showRename && (
          <DropdownMenuItem
            className="gap-2 rounded-xl"
            onSelect={(e) => {
              e.preventDefault();
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" /> Rename workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="gap-2 rounded-xl"
          onSelect={(e) => {
            e.preventDefault();
            onCreateWorkspace();
          }}
        >
          <Plus className="size-4" /> Create new workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <RenameWorkspaceModal open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  );
}
