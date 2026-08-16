import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStoredActiveWorkspace, saveActiveWorkspace } from "@/lib/auth";
import {
  clearDeletedWorkspaceData,
  refetchWorkspaceScopedData,
} from "@/services/workspace-data.service";
import {
  createWorkspace as createWorkspaceRequest,
  deleteWorkspace as deleteWorkspaceRequest,
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
  deleting: boolean;
  fetchWorkspaces: () => Promise<Workspace[]>;
  createWorkspace: (name: string) => Promise<Workspace>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  renameWorkspace: (workspaceId: number, name: string) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: number) => Promise<void>;
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
  const [deleting, setDeleting] = useState(false);

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
          ...(fromList?.created_at ? { created_at: fromList.created_at } : {}),
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
            ? {
                ...item,
                name: workspace.name,
                role: workspace.role,
                ...(workspace.updated_at ? { updated_at: workspace.updated_at } : {}),
              }
            : item,
        ),
      );

      if (activeWorkspace?.id === workspace.id) {
        const next: Workspace = {
          ...activeWorkspace,
          name: workspace.name,
          role: workspace.role,
          ...(workspace.updated_at ? { updated_at: workspace.updated_at } : {}),
        };
        setActiveWorkspace(next);
        saveActiveWorkspace(next);
      }

      return workspace;
    },
    [activeWorkspace],
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: number) => {
      setDeleting(true);
      try {
        await deleteWorkspaceRequest(workspaceId);
        await clearDeletedWorkspaceData(workspaceId, queryClient);

        const { workspaces: list } = await listWorkspaces();
        setWorkspaces(list);

        if (activeWorkspace?.id === workspaceId) {
          const next = list[0] ?? null;
          if (next) {
            try {
              await switchWorkspaceRequest(next.id);
            } catch {
              // Still activate locally if switch fails for any reason.
            }
            await applyActiveWorkspace(next);
          } else {
            await applyActiveWorkspace(null, { refetch: false });
          }
        }
      } finally {
        setDeleting(false);
      }
    },
    [activeWorkspace?.id, applyActiveWorkspace, queryClient],
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
      deleting,
      fetchWorkspaces,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
      deleteWorkspace,
    }),
    [
      workspaces,
      activeWorkspace,
      loading,
      switching,
      deleting,
      fetchWorkspaces,
      createWorkspace,
      switchWorkspace,
      renameWorkspace,
      deleteWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
