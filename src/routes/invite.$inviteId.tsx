import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";
import { clearAuth, getToken, saveActiveWorkspace } from "@/lib/auth";
import { acceptInvitation, listMyInvitations } from "@/services/team.service";
import { listWorkspaces, switchWorkspace } from "@/services/workspace.service";

function invitePath(inviteId: string | number) {
  return `/invite/${inviteId}`;
}

export const Route = createFileRoute("/invite/$inviteId")({
  beforeLoad: ({ params }) => {
    // Only enforce auth in the browser — SSR has no localStorage token.
    if (typeof window === "undefined") return;
    if (!getToken()) {
      throw redirect({
        to: "/signin",
        search: { next: invitePath(params.inviteId) },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Accept invitation — SyncSpace" },
      { name: "description", content: "Accept your SyncSpace workspace invitation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InviteAcceptPage,
});

function InviteAcceptPage() {
  const navigate = useNavigate();
  const { inviteId: inviteIdParam } = Route.useParams();
  const inviteId = Number(inviteIdParam);
  const nextPath = invitePath(inviteIdParam);

  const [status, setStatus] = useState<"idle" | "loading" | "accepted" | "error">("idle");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const goSignIn = () => {
    clearAuth();
    void navigate({ to: "/signin", search: { next: nextPath } });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        goSignIn();
        return;
      }

      if (!Number.isInteger(inviteId) || inviteId <= 0) {
        setErrorMessage("This invitation link is invalid.");
        setStatus("error");
        setLoadingPreview(false);
        return;
      }

      try {
        const { invitations } = await listMyInvitations();
        if (cancelled) return;
        const match = invitations.find((item) => item.id === inviteId);
        if (match) {
          setPreviewName(match.workspace_name || "Workspace");
          setPreviewRole(match.role);
        } else {
          setPreviewName(null);
          setPreviewRole(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          toast.error("Please sign in with the invited email to accept.");
          goSignIn();
          return;
        }
        setErrorMessage(err instanceof Error ? err.message : "Could not load this invitation.");
        setStatus("error");
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run for invite id
  }, [inviteId, inviteIdParam]);

  const onAccept = async () => {
    if (!getToken()) {
      goSignIn();
      return;
    }
    if (!Number.isInteger(inviteId) || inviteId <= 0) {
      setErrorMessage("This invitation link is invalid.");
      setStatus("error");
      return;
    }
    if (status === "loading" || status === "accepted") return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await acceptInvitation(inviteId);
      setWorkspaceName(data.workspace.name);
      setRole(data.workspace.role);
      setStatus("accepted");
      toast.success(`Joined ${data.workspace.name}`);

      try {
        const { workspaces } = await listWorkspaces();
        const joined = workspaces.find((workspace) => workspace.id === data.workspace.id);
        if (joined) {
          await switchWorkspace(joined.id);
          saveActiveWorkspace(joined);
        } else {
          saveActiveWorkspace({
            id: data.workspace.id,
            name: data.workspace.name,
            role: data.workspace.role,
          });
        }
      } catch {
        saveActiveWorkspace({
          id: data.workspace.id,
          name: data.workspace.name,
          role: data.workspace.role,
        });
      }

      window.setTimeout(() => {
        void navigate({ to: "/app/team" });
      }, 900);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        toast.error("Please sign in with the invited email to accept.");
        goSignIn();
        return;
      }
      const message =
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to accept invitation.";
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    }
  };

  return (
    <AuthLayout
      title={status === "accepted" ? "You're in" : "Workspace invitation"}
      subtitle={
        status === "accepted"
          ? `Welcome to ${workspaceName}. Opening your team…`
          : previewName
            ? `You've been invited to join ${previewName}${previewRole ? ` as ${previewRole}` : ""}.`
            : "Sign in with the invited email, then accept in this tab."
      }
      footer={
        <>
          Wrong account?{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={goSignIn}
          >
            Sign in with the invited email
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {loadingPreview && status === "idle" ? (
          <p className="text-sm text-muted-foreground">Loading invitation…</p>
        ) : null}

        {status === "accepted" ? (
          <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-success">
              <Check className="size-4" /> Invitation accepted
            </p>
            <p className="mt-1 text-muted-foreground">
              You are now a{" "}
              <span className="font-semibold text-foreground">{role || "Member"}</span> of{" "}
              <span className="font-semibold text-foreground">{workspaceName}</span>.
            </p>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            <Button
              variant="hero"
              className="h-12 w-full rounded-2xl"
              disabled={status === "loading" || !Number.isInteger(inviteId) || inviteId <= 0}
              onClick={() => void onAccept()}
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {status === "loading" ? "Accepting…" : "Accept invitation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-2xl"
              onClick={goSignIn}
            >
              Sign in to continue
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
