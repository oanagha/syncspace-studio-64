import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStoredActiveWorkspace, saveActiveWorkspace } from "@/lib/auth";
import { refetchWorkspaceScopedData } from "@/services/workspace-data.service";
import {
  createWorkspace as createWorkspaceRequest,
  listWorkspaces,
  renameWorkspace as renameWorkspaceRequest,
  switchWorkspace as switchWorkspaceRequest,
  type Workspace,
} from "@/services/workspace.service";

type WorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  switching: boolean;
  fetchWorkspaces: () => Promise<Workspace[]>;
  createWorkspace: (name: string) => Promise<Workspace>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  renameWorkspace: (workspaceId: number, name: string) => Promise<Workspace>;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function resolveActiveWorkspace(list: Workspace[], preferred: Workspace | null) {
  if (preferred) {
    const match = list.find((workspace) => workspace.id === preferred.id);
    if (match) return match;
  }
  return list[0] ?? null;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(() => {
    const stored = getStoredActiveWorkspace();
    return stored?.name ? stored : null;
  });
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const applyActiveWorkspace = useCallback(
    async (workspace: Workspace | null, { refetch = true } = {}) => {
      setActiveWorkspace(workspace);
      saveActiveWorkspace(workspace);

      if (!workspace) return;

      if (refetch) {
        await refetchWorkspaceScopedData(workspace.id, queryClient);
      }
    },
    [queryClient],
  );

  const fetchWorkspaces = useCallback(async () => {
    const { workspaces: list } = await listWorkspaces();
    const next = resolveActiveWorkspace(list, getStoredActiveWorkspace());

    setWorkspaces(list);
    await applyActiveWorkspace(next, { refetch: Boolean(next) });

    return list;
  }, [applyActiveWorkspace]);

  const switchWorkspace = useCallback(
    async (workspaceId: number) => {
      if (activeWorkspace?.id === workspaceId) return;

      setSwitching(true);
      try {
        const { active_workspace } = await switchWorkspaceRequest(workspaceId);
        const fromList = workspaces.find((workspace) => workspace.id === active_workspace.id);
        const next: Workspace = {
          id: active_workspace.id,
          name: active_workspace.name,
          role: active_workspace.role,
          created_at: fromList?.created_at,
        };

        setWorkspaces((prev) =>
          prev.some((workspace) => workspace.id === next.id) ? prev : [next, ...prev],
        );
        await applyActiveWorkspace(next);
      } finally {
        setSwitching(false);
      }
    },
    [activeWorkspace?.id, applyActiveWorkspace, workspaces],
  );

  const createWorkspace = useCallback(
    async (name: string) => {
      const { workspace } = await createWorkspaceRequest(name);
      setWorkspaces((prev) => [workspace, ...prev.filter((item) => item.id !== workspace.id)]);
      try {
        await switchWorkspaceRequest(workspace.id);
      } catch {
        // Creator is already a member; keep the new workspace active locally.
      }
      await applyActiveWorkspace(workspace);
      return workspace;
    },
    [applyActiveWorkspace],
  );

  const renameWorkspace = useCallback(
    async (workspaceId: number, name: string) => {
      const { workspace } = await renameWorkspaceRequest(workspaceId, name);

      setWorkspaces((prev) =>
        prev.map((item) =>
          item.id === workspace.id
            ? { ...item, name: workspace.name, role: workspace.role, updated_at: workspace.updated_at }
            : item,
        ),
      );

      if (activeWorkspace?.id === workspace.id) {
        const next = {
          ...activeWorkspace,
          name: workspace.name,
          role: workspace.role,
          updated_at: workspace.updated_at,
        };
        setActiveWorkspace(next);
        saveActiveWorkspace(next);
      }

      return workspace;
    },
    [activeWorkspace],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchWorkspaces();
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        if (!cancelled) {
          setWorkspaces([]);
          toast.error(err instanceof Error ? err.message : "Failed to load workspaces.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Load once on mount; stored workspace is already in state for fast render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      loading,
      switching,
      fetchWorkspaces,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
    }),
    [
      workspaces,
      activeWorkspace,
      loading,
      switching,
      fetchWorkspaces,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
