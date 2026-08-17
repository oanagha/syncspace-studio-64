import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Mail, MoreHorizontal, Shield, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedBar } from "@/components/ux/motion";
import { ConfirmDeleteDialog, DeleteEntityName } from "@/components/ux/ConfirmDeleteDialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePreferences } from "@/hooks/usePreferences";
import { memberAvatarColor } from "@/services/project.service";
import {
  acceptInvitation,
  canManageTeam,
  cancelInvitation,
  invitationQueryKey,
  inviteToWorkspace,
  listInvitations,
  listMembers,
  listMyInvitations,
  myInvitationsQueryKey,
  removeMember,
  teamMembersQueryKey,
  updateMemberRole,
} from "@/services/team.service";
import { getUser } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/app/team")({
  head: () => ({
    meta: [
      { title: "Team & Permissions — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Invite teammates, manage Owner/Admin/Member roles and review a granular permissions matrix.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

const permissions = [
  ["Create & delete projects", true, true, false, false],
  ["Invite members", true, true, false, false],
  ["Manage billing", true, false, false, false],
  ["Edit tasks & boards", true, true, true, false],
  ["Comment on tasks", true, true, true, true],
  ["Upload files", true, true, true, false],
  ["View analytics", true, true, true, false],
  ["Manage SSO & audit logs", true, false, false, false],
] as const;

const palette = ["#1A4A6E", "#2D8A9E", "#5CBDB9", "#2F9E7D", "#D9A441", "#E07A5F"];

function TeamPage() {
  const queryClient = useQueryClient();
  const { activeWorkspace, fetchWorkspaces, switchWorkspace } = useWorkspace();
  const { preferences } = usePreferences();
  const [emails, setEmails] = useState("");
  const [pendingRemove, setPendingRemove] = useState<{ userId: number; name: string } | null>(null);
  const [acceptedInviteIds, setAcceptedInviteIds] = useState<number[]>([]);
  const [recentAccepts, setRecentAccepts] = useState<
    { id: number; workspace_name: string; role: string }[]
  >([]);
  const workspaceName = activeWorkspace?.name || "this workspace";
  const guestsAllowed = preferences.guestAccess;
  const [role, setRole] = useState("Member");
  const currentUser = getUser();
  const currentEmail = (currentUser?.email || "").toLowerCase();
  const canManage = canManageTeam(activeWorkspace?.role);
  const isOwner = activeWorkspace?.role === "Owner";

  useEffect(() => {
    if (!guestsAllowed && role === "Guest") setRole("Member");
  }, [guestsAllowed, role]);

  const invitesQuery = useQuery({
    queryKey: invitationQueryKey(activeWorkspace?.id),
    queryFn: () => listInvitations(activeWorkspace!.id),
    enabled: Boolean(activeWorkspace?.id) && canManage,
  });
  const pending = invitesQuery.data?.invitations ?? [];

  const myInvitesQuery = useQuery({
    queryKey: myInvitationsQueryKey(),
    queryFn: listMyInvitations,
  });
  const myInvites = myInvitesQuery.data?.invitations ?? [];

  const membersQuery = useQuery({
    queryKey: teamMembersQueryKey(activeWorkspace?.id),
    queryFn: () => listMembers(activeWorkspace!.id),
    enabled: Boolean(activeWorkspace?.id),
  });
  const members = membersQuery.data?.members ?? [];

  const invalidateTeam = () => {
    void queryClient.invalidateQueries({ queryKey: teamMembersQueryKey(activeWorkspace?.id) });
    void queryClient.invalidateQueries({ queryKey: invitationQueryKey(activeWorkspace?.id) });
    void queryClient.invalidateQueries({ queryKey: myInvitationsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: ["team", activeWorkspace?.id ?? null] });
  };

  const inviteMutation = useMutation({
    mutationFn: async (list: string[]) => {
      if (!activeWorkspace) throw new Error("Select a workspace first.");
      const results = [];
      for (const email of list) {
        results.push(
          await inviteToWorkspace({
            workspaceId: activeWorkspace.id,
            email,
            role,
          }),
        );
      }
      return results;
    },
    onSuccess: (results) => {
      setEmails("");
      const warnings = results.filter((item) => item.warning);
      if (warnings.length > 0) {
        toast.warning(
          `${results.length} invite${results.length > 1 ? "s" : ""} saved as ${role}, but email delivery failed for ${warnings.length}.`,
        );
      } else {
        toast.success(
          `${results.length} invite email${results.length > 1 ? "s" : ""} sent as ${role}`,
        );
      }
      invalidateTeam();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to send invite.",
      );
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (input: { userId: number; role: string }) => {
      if (!activeWorkspace) throw new Error("Select a workspace first.");
      return updateMemberRole({
        userId: input.userId,
        workspaceId: activeWorkspace.id,
        role: input.role,
      });
    },
    onSuccess: (data) => {
      toast.success(`${data.member.name} is now ${data.member.role}`);
      invalidateTeam();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to change role.",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (input: { userId: number; name: string }) => {
      if (!activeWorkspace) throw new Error("Select a workspace first.");
      return removeMember({ userId: input.userId, workspaceId: activeWorkspace.id });
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.name} removed from workspace`);
      invalidateTeam();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to remove member.",
      );
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId: number) => cancelInvitation(invitationId),
    onSuccess: () => {
      toast.success("Invitation cancelled");
      invalidateTeam();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to cancel invite.",
      );
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: (invitationId: number) => acceptInvitation(invitationId),
    onSuccess: async (data, invitationId) => {
      const inviteMeta =
        myInvites.find((item) => item.id === invitationId) ||
        pending.find((item) => item.id === invitationId);

      setAcceptedInviteIds((current) =>
        current.includes(invitationId) ? current : [...current, invitationId],
      );
      setRecentAccepts((current) => [
        {
          id: invitationId,
          workspace_name: data.workspace.name,
          role: data.workspace.role || inviteMeta?.role || "Member",
        },
        ...current.filter((item) => item.id !== invitationId),
      ]);

      // Drop from "invitations for you" immediately; keep pending row briefly as Accepted.
      queryClient.setQueryData<{ invitations: typeof myInvites }>(
        myInvitationsQueryKey(),
        (current) => ({
          invitations: (current?.invitations ?? []).filter((item) => item.id !== invitationId),
        }),
      );

      toast.success(`Joined ${data.workspace.name} — you're now a member`);

      const joinedWorkspaceId = data.workspace.id;
      try {
        await fetchWorkspaces();
        await switchWorkspace(joinedWorkspaceId);
      } catch {
        // Workspace list refresh is enough if switch fails.
      }

      invalidateTeam();
      void queryClient.invalidateQueries({ queryKey: teamMembersQueryKey(joinedWorkspaceId) });
      void queryClient.invalidateQueries({ queryKey: invitationQueryKey(joinedWorkspaceId) });
      void queryClient.invalidateQueries({ queryKey: myInvitationsQueryKey() });

      // After members refresh, clear the accepted pending chip.
      window.setTimeout(() => {
        setAcceptedInviteIds((current) => current.filter((id) => id !== invitationId));
        queryClient.setQueryData<{ invitations: typeof pending }>(
          invitationQueryKey(joinedWorkspaceId),
          (current) => ({
            invitations: (current?.invitations ?? []).filter((item) => item.id !== invitationId),
          }),
        );
      }, 1600);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to accept invite.",
      );
    },
  });

  const sendInvites = () => {
    const list = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (list.length === 0) {
      toast.error("Add at least one valid email address.");
      return;
    }
    if (!activeWorkspace) {
      toast.error("Select a workspace first.");
      return;
    }
    inviteMutation.mutate(list);
  };

  const changeRole = (userId: number, next: string) => {
    if (!canManage) {
      toast.error("Only owners and admins can change roles.");
      return;
    }
    changeRoleMutation.mutate({ userId, role: next });
  };

  const removeMemberAction = (userId: number, name: string) => {
    if (!canManage) {
      toast.error("Only owners and admins can remove members.");
      return;
    }
    setPendingRemove({ userId, name });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} members · {pending.length} pending invites
          </p>
        </div>
        <Button variant="hero" onClick={() => document.getElementById("invite-emails")?.focus()}>
          <UserPlus /> Invite members
        </Button>
      </header>

      {(myInvites.length > 0 || recentAccepts.length > 0) && (
        <section className="surface-card space-y-3 p-6">
          <h2 className="text-lg font-bold">Invitations for you</h2>
          <p className="text-sm text-muted-foreground">Accept to join these workspaces.</p>
          {recentAccepts.map((invite) => (
            <div
              key={`accepted-${invite.id}`}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-success/30 bg-success/5 px-4 py-2.5"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-success/15 text-xs font-bold text-success">
                {invite.workspace_name[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{invite.workspace_name}</p>
                <p className="truncate text-xs text-muted-foreground">Now a {invite.role}</p>
              </div>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                Accepted
              </span>
            </div>
          ))}
          {myInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border px-4 py-2.5"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                {(invite.workspace_name || invite.email)[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {invite.workspace_name || "Workspace"}
                </p>
                <p className="truncate text-xs text-muted-foreground">Invited as {invite.role}</p>
              </div>
              <Button
                variant="hero"
                size="sm"
                disabled={acceptInviteMutation.isPending}
                onClick={() => acceptInviteMutation.mutate(invite.id)}
              >
                <Check className="size-3.5" />
                {acceptInviteMutation.isPending && acceptInviteMutation.variables === invite.id
                  ? "Joining…"
                  : "Accept"}
              </Button>
            </div>
          ))}
        </section>
      )}

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold">Invite teammates</h2>
        <p className="text-sm text-muted-foreground">
          They&apos;ll get access to {workspaceName} and every project you share.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="invite-emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvites()}
              placeholder="name@company.com, comma separated"
              className="h-11 rounded-2xl pl-9"
              disabled={!canManage}
            />
          </div>
          <Select value={role} onValueChange={setRole} disabled={!canManage}>
            <SelectTrigger className="h-11 w-full rounded-2xl sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isOwner ? <SelectItem value="Admin">Admin</SelectItem> : null}
              <SelectItem value="Member">Member</SelectItem>
              {guestsAllowed ? <SelectItem value="Guest">Guest</SelectItem> : null}
            </SelectContent>
          </Select>
          <Button
            variant="hero"
            className="h-11"
            onClick={sendInvites}
            disabled={inviteMutation.isPending || !canManage}
          >
            {inviteMutation.isPending ? "Sending..." : "Send invites"}
          </Button>
        </div>

        {pending.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pending invites
            </p>
            {pending.map((p) => {
              const isMine = currentEmail && p.email.toLowerCase() === currentEmail;
              const justAccepted = acceptedInviteIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border px-4 py-2.5"
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                    {p.email[0]?.toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">{p.email}</p>
                  <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground sm:inline">
                    {p.role}
                  </span>
                  {justAccepted ? (
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                      Accepted
                    </span>
                  ) : isMine ? (
                    <Button
                      variant="hero"
                      size="sm"
                      disabled={acceptInviteMutation.isPending}
                      onClick={() => acceptInviteMutation.mutate(p.id)}
                    >
                      Accept
                    </Button>
                  ) : null}
                  {canManage && !justAccepted ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Cancel invite for ${p.email}`}
                      disabled={cancelInviteMutation.isPending}
                      onClick={() => cancelInviteMutation.mutate(p.id)}
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-bold">Members</h2>
        <div className="mt-4 divide-y divide-border">
          {membersQuery.isLoading ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              No members in this workspace yet.
            </p>
          ) : null}
          {members.map((m, i) => {
            const busy =
              (changeRoleMutation.isPending && changeRoleMutation.variables?.userId === m.id) ||
              (removeMutation.isPending && removeMutation.variables?.userId === m.id);
            const roleOptions = [
              ...(isOwner ? ["Admin"] : []),
              "Member",
              ...(guestsAllowed ? ["Guest"] : []),
            ].filter((r) => r !== m.role);
            const canActOnMember =
              canManage &&
              m.role !== "Owner" &&
              m.id !== currentUser?.id &&
              !(activeWorkspace?.role === "Admin" && m.role === "Admin");

            return (
              <div
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]"
                style={{
                  animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 20, 100)}ms both`,
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-bold text-primary-foreground"
                    style={{ background: memberAvatarColor(m.id) || palette[i % palette.length] }}
                  >
                    {m.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                    <Shield className="size-3" /> {m.role}
                  </span>
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="text-xs text-muted-foreground">
                    {m.tasks} tasks · {m.activity}% active
                  </p>
                  <div className="mt-1.5">
                    <AnimatedBar value={m.activity} color={memberAvatarColor(m.id)} />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Options for ${m.name}`}
                      disabled={busy}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                    <DropdownMenuLabel>{m.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-xl"
                      onClick={() =>
                        toast(m.name, { description: `${m.email} · ${m.tasks} open tasks` })
                      }
                    >
                      View profile
                    </DropdownMenuItem>
                    {canActOnMember &&
                      roleOptions.map((r) => (
                        <DropdownMenuItem
                          key={r}
                          className="rounded-xl"
                          disabled={changeRoleMutation.isPending}
                          onClick={() => changeRole(m.id, r)}
                        >
                          Make {r}
                        </DropdownMenuItem>
                      ))}
                    {canActOnMember && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="rounded-xl text-destructive focus:text-destructive"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMemberAction(m.id, m.name)}
                        >
                          Remove from workspace
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card overflow-x-auto p-6">
        <h2 className="text-lg font-bold">Permissions</h2>
        <table className="mt-4 w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 font-bold">Capability</th>
              <th className="pb-3 font-bold">Owner</th>
              <th className="pb-3 font-bold">Admin</th>
              <th className="pb-3 font-bold">Member</th>
              <th className="pb-3 font-bold">Guest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {permissions.map(([cap, o, a, mm, g]) => (
              <tr key={cap as string}>
                <td className="py-3 pr-4 font-medium">{cap}</td>
                {[o, a, mm, g].map((v, idx) => (
                  <td key={idx} className="py-3">
                    <span
                      className={
                        v
                          ? "inline-grid size-6 place-items-center rounded-full bg-success/15 text-xs font-bold text-success"
                          : "inline-grid size-6 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                      }
                    >
                      {v ? "✓" : "–"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConfirmDeleteDialog
        open={Boolean(pendingRemove)}
        onOpenChange={(next) => {
          if (!next) setPendingRemove(null);
        }}
        title="Remove teammate?"
        description={
          <>
            <DeleteEntityName>{pendingRemove?.name ?? "This member"}</DeleteEntityName> will lose
            access to {workspaceName}. Their assigned tasks will remain in the workspace.
          </>
        }
        confirmLabel="Remove member"
        tone="caution"
        pending={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingRemove) return;
          removeMutation.mutate(pendingRemove, {
            onSuccess: () => setPendingRemove(null),
          });
        }}
      />
    </div>
  );
}
