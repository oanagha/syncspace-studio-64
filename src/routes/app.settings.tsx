import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useLayoutEffect, useRef, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePreferences } from "@/hooks/usePreferences";
import { Loader2, TriangleAlert } from "lucide-react";
import { Bell, Link2, Palette, Shield, SlidersHorizontal, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ApiRequestError } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";
import { ConfirmDeleteDialog, DeleteEntityName } from "@/components/ux/ConfirmDeleteDialog";
import {
  canDeleteWorkspace,
  canRenameWorkspace,
  workspaceInitials,
} from "@/services/workspace.service";
import {
  ACCENT_THEMES,
  ACCENTS,
  applyAccent,
  removeAvatar,
  resolveAvatarUrl,
  uploadAvatar,
  validateAvatarFile,
  type AccentPreference,
  type PreferencesPatch,
  type SidebarPreference,
  type ThemePreference,
  type UserPreferences,
} from "@/services/settings.service";
import {
  disableTwoFactor,
  enableTwoFactor,
  setupTwoFactor,
  type TwoFactorSetup,
} from "@/services/twofactor.service";

const tabs = [
  { v: "profile", label: "Profile", icon: User },
  { v: "security", label: "Security", icon: Shield },
  { v: "notifications", label: "Notifications", icon: Bell },
  { v: "appearance", label: "Appearance", icon: Palette },
  { v: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { v: "connected", label: "Connected", icon: Link2 },
] as const;

type SettingsTab = (typeof tabs)[number]["v"];

const TAB_VALUES = new Set<string>(tabs.map((tab) => tab.v));

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && TAB_VALUES.has(value);
}

type SettingsSearch = {
  tab?: SettingsTab;
};

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const SIDEBAR_LABELS: Record<SidebarPreference, string> = {
  expanded: "Expanded",
  collapsed: "Collapsed",
};

export const Route = createFileRoute("/app/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const tab = search["tab"];
    return isSettingsTab(tab) ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Profile & Settings — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Update your profile, security, notification, appearance and workspace preferences plus connected accounts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const connectedAccounts = [
  { key: "slack" as const, name: "Slack", desc: "Post task updates to #product" },
  { key: "github" as const, name: "GitHub", desc: "Link pull requests to tasks" },
  { key: "figma" as const, name: "Figma", desc: "Embed live design previews" },
  { key: "googleDrive" as const, name: "Google Drive", desc: "Attach docs without uploading" },
];

function SettingsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { tab } = Route.useSearch();
  const activeTab = tab ?? "profile";
  const { activeWorkspace, fetchWorkspaces, deleteWorkspace, deleting } = useWorkspace();
  const { preferences, loading, saving, updatePreferences, replacePreferences } = usePreferences();
  const [draft, setDraft] = useState<UserPreferences>(preferences);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);
  const [deleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const canEditWorkspace = canRenameWorkspace(activeWorkspace?.role);
  const canRemoveWorkspace = canDeleteWorkspace(activeWorkspace?.role);
  const workspaceSlug = (draft.workspaceName || activeWorkspace?.name || "workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  useLayoutEffect(() => {
    setComingSoonFeature(null);
  }, [activeTab]);

  useLayoutEffect(() => {
    setDraft({
      ...preferences,
      workspaceName: preferences.workspaceName || activeWorkspace?.name || "",
    });
  }, [preferences, activeWorkspace?.name]);

  const skipInitialAccent = useRef(true);
  useLayoutEffect(() => {
    if (skipInitialAccent.current) {
      skipInitialAccent.current = false;
      return;
    }
    applyAccent(draft.accent);
  }, [draft.accent]);

  const savePreferences = async (patch: PreferencesPatch, success = "Settings saved") => {
    try {
      const next = await updatePreferences(patch);
      if (patch.fullName || patch.email) {
        updateStoredUser({
          ...(patch.fullName ? { name: next.fullName } : {}),
          ...(patch.email ? { email: next.email } : {}),
        });
      }
      if (patch.workspaceName && activeWorkspace) {
        await fetchWorkspaces().catch(() => undefined);
      }
      toast.success(success);
      return next;
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to save settings.",
      );
      return null;
    }
  };

  const initials = workspaceInitials(draft.fullName || "Account");
  const avatarSrc = resolveAvatarUrl(draft.avatarUrl ?? preferences.avatarUrl);

  const onAvatarSelected = async (file: File | undefined) => {
    if (!file || avatarBusy) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setAvatarBusy(true);
    try {
      const result = await uploadAvatar(file);
      const merged = replacePreferences(result.preferences);
      setDraft((current) => ({ ...current, avatarUrl: merged.avatarUrl }));
      toast.success("Photo updated");
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to upload photo.",
      );
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const onRemoveAvatar = async () => {
    if (avatarBusy) return;
    setRemoveAvatarOpen(true);
  };

  const runRemoveAvatar = async () => {
    if (avatarBusy) return;
    setAvatarBusy(true);
    try {
      const result = await removeAvatar();
      const merged = replacePreferences(result.preferences);
      setDraft((current) => ({ ...current, avatarUrl: merged.avatarUrl }));
      setRemoveAvatarOpen(false);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to remove photo.",
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const runDeleteWorkspace = async () => {
    if (!activeWorkspace || deleting) return;
    const name = activeWorkspace.name;
    try {
      await deleteWorkspace(activeWorkspace.id);
      setDeleteWorkspaceOpen(false);
      toast.success(`Workspace “${name}” deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workspace.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and workspace preferences.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          const value = isSettingsTab(next) ? next : "profile";
          void navigate({
            search: value === "profile" ? {} : { tab: value },
            replace: true,
          });
        }}
        className="space-y-6"
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-card p-1.5">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="gap-2 rounded-xl px-3.5 py-2 text-sm data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"
            >
              <t.icon className="size-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <Card title="Personal information" desc="This is how teammates see you across SyncSpace.">
            <div className="flex items-center gap-4">
              {avatarSrc ? (
                <span
                  className="size-16 overflow-hidden rounded-3xl bg-muted bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatarSrc})` }}
                  aria-label="Profile photo"
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-3xl gradient-brand text-lg font-bold text-primary-foreground">
                  {initials || "?"}
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => void onAvatarSelected(event.target.files?.[0])}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={avatarBusy || loading}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarBusy && <Loader2 className="size-4 animate-spin" />}
                  {avatarBusy ? "Uploading…" : "Upload photo"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={avatarBusy || loading || !avatarSrc}
                  onClick={() => void onRemoveAvatar()}
                >
                  Remove
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                id="fn"
                label="Full name"
                value={draft.fullName}
                onChange={(fullName) => setDraft((current) => ({ ...current, fullName }))}
              />
              <FieldInput
                id="em"
                label="Email"
                value={draft.email}
                type="email"
                onChange={(email) => setDraft((current) => ({ ...current, email }))}
              />
              <FieldInput
                id="rl"
                label="Job title"
                value={draft.jobTitle}
                onChange={(jobTitle) => setDraft((current) => ({ ...current, jobTitle }))}
              />
              <FieldInput
                id="tz"
                label="Timezone"
                value={draft.timezone}
                onChange={(timezone) => setDraft((current) => ({ ...current, timezone }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                className="rounded-2xl"
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, bio: event.target.value }))
                }
              />
            </div>
            <SaveRow
              saving={saving}
              disabled={loading}
              onCancel={() => setDraft(preferences)}
              onSave={() =>
                savePreferences({
                  fullName: draft.fullName,
                  email: draft.email,
                  jobTitle: draft.jobTitle,
                  timezone: draft.timezone,
                  bio: draft.bio,
                })
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card title="Security" desc="Protect your account and active sessions.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                id="cp"
                label="Current password"
                value={currentPassword}
                type="password"
                onChange={setCurrentPassword}
              />
              <FieldInput
                id="np"
                label="New password"
                value={newPassword}
                type="password"
                onChange={setNewPassword}
              />
            </div>
            <Separator />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">
                  {draft.twoFactor
                    ? "Enabled — you’ll need an authenticator code when signing in."
                    : "Add an authenticator app for a 6-digit code at sign-in."}
                </p>
              </div>
              {draft.twoFactor ? (
                <Button
                  variant="outline"
                  disabled={twoFactorBusy || loading}
                  onClick={() => {
                    setDisablePassword("");
                    setDisableCode("");
                    setDisableOpen(true);
                  }}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  variant="hero"
                  disabled={twoFactorBusy || loading}
                  onClick={async () => {
                    setTwoFactorBusy(true);
                    try {
                      const setup = await setupTwoFactor();
                      setSetupData(setup);
                      setTotpCode("");
                      setSetupOpen(true);
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Could not start 2FA setup.",
                      );
                    } finally {
                      setTwoFactorBusy(false);
                    }
                  }}
                >
                  {twoFactorBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Enable 2FA
                </Button>
              )}
            </div>
            <Toggle
              label="Login alerts"
              desc="Email me when a new device or location signs in."
              checked={draft.loginAlerts}
              onCheckedChange={(loginAlerts) =>
                setDraft((current) => ({ ...current, loginAlerts }))
              }
            />
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-bold">Active sessions</p>
              {[["This browser", "Current session"]].map(([d, t]) => (
                <div
                  key={d}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{d}</p>
                    <p className="text-xs text-muted-foreground">{t}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success(`Signed out of ${d}`)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
            <SaveRow
              saving={saving}
              disabled={loading}
              onCancel={() => {
                setDraft(preferences);
                setCurrentPassword("");
                setNewPassword("");
              }}
              onSave={async () => {
                const patch: PreferencesPatch = {
                  loginAlerts: draft.loginAlerts,
                };
                if (currentPassword || newPassword) {
                  patch.currentPassword = currentPassword;
                  patch.newPassword = newPassword;
                }
                const next = await savePreferences(patch);
                if (next) {
                  setCurrentPassword("");
                  setNewPassword("");
                }
              }}
            />
          </Card>

          <Dialog
            open={setupOpen}
            onOpenChange={(open) => {
              setSetupOpen(open);
              if (!open) {
                setSetupData(null);
                setTotpCode("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set up authenticator</DialogTitle>
                <DialogDescription>
                  Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the
                  6-digit code.
                </DialogDescription>
              </DialogHeader>
              {setupData ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={setupData.qrUrl}
                      alt="2FA QR code"
                      className="size-48 rounded-xl border border-border bg-white p-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Manual secret
                    </p>
                    <code className="block break-all rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
                      {setupData.secret}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setup-totp">Verification code</Label>
                    <Input
                      id="setup-totp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className="h-11 rounded-2xl tracking-[0.3em] text-center"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                </div>
              ) : null}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSetupOpen(false)}
                  disabled={twoFactorBusy}
                >
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  disabled={twoFactorBusy || !/^\d{6}$/.test(totpCode)}
                  onClick={async () => {
                    setTwoFactorBusy(true);
                    try {
                      await enableTwoFactor(totpCode);
                      setDraft((current) => ({ ...current, twoFactor: true }));
                      replacePreferences({ ...preferences, ...draft, twoFactor: true });
                      toast.success("Two-factor authentication enabled");
                      setSetupOpen(false);
                      setSetupData(null);
                      setTotpCode("");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not enable 2FA.");
                    } finally {
                      setTwoFactorBusy(false);
                    }
                  }}
                >
                  {twoFactorBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirm & enable
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={disableOpen}
            onOpenChange={(open) => {
              setDisableOpen(open);
              if (!open) {
                setDisablePassword("");
                setDisableCode("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Disable two-factor authentication</DialogTitle>
                <DialogDescription>
                  Confirm with your password and a current authenticator code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disable-password">Password</Label>
                  <Input
                    id="disable-password"
                    type="password"
                    className="h-11 rounded-2xl"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disable-totp">Authenticator code</Label>
                  <Input
                    id="disable-totp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="h-11 rounded-2xl tracking-[0.3em] text-center"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDisableOpen(false)}
                  disabled={twoFactorBusy}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={twoFactorBusy || !disablePassword || !/^\d{6}$/.test(disableCode)}
                  onClick={async () => {
                    setTwoFactorBusy(true);
                    try {
                      await disableTwoFactor(disablePassword, disableCode);
                      setDraft((current) => ({ ...current, twoFactor: false }));
                      replacePreferences({ ...preferences, ...draft, twoFactor: false });
                      toast.success("Two-factor authentication disabled");
                      setDisableOpen(false);
                      setDisablePassword("");
                      setDisableCode("");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not disable 2FA.");
                    } finally {
                      setTwoFactorBusy(false);
                    }
                  }}
                >
                  {twoFactorBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Disable 2FA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="notifications">
          <Card title="Notifications" desc="Choose what reaches you and where.">
            <Toggle
              label="In-app notifications"
              desc="Show mentions and alerts in the header. This setting is saved to your account."
              checked={draft.notifications}
              onCheckedChange={(notifications) =>
                setDraft((current) => ({ ...current, notifications }))
              }
            />
            <Toggle
              label="Mentions"
              desc="Someone @mentions you in a comment or doc."
              checked={draft.notifyMentions}
              onCheckedChange={(notifyMentions) =>
                setDraft((current) => ({ ...current, notifyMentions }))
              }
              disabled={!draft.notifications}
            />
            <Toggle
              label="Task assignments"
              desc="A task is assigned to you or reassigned."
              checked={draft.notifyAssignments}
              onCheckedChange={(notifyAssignments) =>
                setDraft((current) => ({ ...current, notifyAssignments }))
              }
              disabled={!draft.notifications}
            />
            <Toggle
              label="Due date reminders"
              desc="24 hours before a task is due."
              checked={draft.notifyDueDates}
              onCheckedChange={(notifyDueDates) =>
                setDraft((current) => ({ ...current, notifyDueDates }))
              }
              disabled={!draft.notifications}
            />
            <Toggle
              label="File uploads"
              desc="New files added to projects you follow."
              checked={draft.notifyFiles}
              onCheckedChange={(notifyFiles) =>
                setDraft((current) => ({ ...current, notifyFiles }))
              }
              disabled={!draft.notifications}
            />
            <Toggle
              label="Weekly digest"
              desc="Monday summary of team productivity."
              checked={draft.notifyDigest}
              onCheckedChange={(notifyDigest) =>
                setDraft((current) => ({ ...current, notifyDigest }))
              }
              disabled={!draft.notifications}
            />
            <SaveRow
              saving={saving}
              disabled={loading}
              onCancel={() => setDraft(preferences)}
              onSave={() =>
                savePreferences({
                  notifications: draft.notifications,
                  notifyMentions: draft.notifyMentions,
                  notifyAssignments: draft.notifyAssignments,
                  notifyDueDates: draft.notifyDueDates,
                  notifyFiles: draft.notifyFiles,
                  notifyDigest: draft.notifyDigest,
                })
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card title="Appearance" desc="Theme, accent, and sidebar stay saved across sessions.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={draft.theme}
                  onValueChange={(theme) =>
                    setDraft((current) => ({ ...current, theme: theme as ThemePreference }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <span className="flex-1 truncate text-left">{THEME_LABELS[draft.theme]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sidebar</Label>
                <Select
                  value={draft.sidebar}
                  onValueChange={(sidebar) =>
                    setDraft((current) => ({ ...current, sidebar: sidebar as SidebarPreference }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <span className="flex-1 truncate text-left">{SIDEBAR_LABELS[draft.sidebar]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expanded">Expanded</SelectItem>
                    <SelectItem value="collapsed">Collapsed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AccentPicker
              value={draft.accent}
              onChange={(accent) => setDraft((current) => ({ ...current, accent }))}
            />
            <SaveRow
              saving={saving}
              disabled={loading}
              onCancel={() => setDraft(preferences)}
              onSave={() =>
                savePreferences({
                  theme: draft.theme,
                  sidebar: draft.sidebar,
                  accent: draft.accent,
                })
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card
            title="Workspace preferences"
            desc={`Applies to everyone in ${draft.workspaceName || activeWorkspace?.name || "your workspace"}.`}
          >
            {comingSoonFeature ? (
              <ComingSoonNotice feature={comingSoonFeature} />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                id="wn"
                label="Workspace name"
                value={draft.workspaceName}
                disabled={!canEditWorkspace}
                onChange={(workspaceName) => setDraft((current) => ({ ...current, workspaceName }))}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => setComingSoonFeature("Custom workspace URLs")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setComingSoonFeature("Custom workspace URLs");
                  }
                }}
              >
                <FieldInput
                  id="wu"
                  label="Workspace URL"
                  value={`syncspace.io/${workspaceSlug || "workspace"}`}
                  readOnly
                />
              </div>
            </div>
            <Toggle
              label="Guest client access"
              desc="Allow comment-only guests on shared projects."
              checked={draft.guestAccess}
              onCheckedChange={() => setComingSoonFeature("Guest client access")}
              disabled={!canEditWorkspace}
            />
            <Toggle
              label="Require 2FA for all members"
              desc="Require every member to enable two-factor authentication."
              checked={draft.require2fa}
              onCheckedChange={() => setComingSoonFeature("Required 2FA for all members")}
              disabled={!canEditWorkspace}
            />
            <Toggle
              label="Public project templates"
              desc="Let members publish templates to the gallery."
              checked={draft.publicTemplates}
              onCheckedChange={() => setComingSoonFeature("Public project templates")}
              disabled={!canEditWorkspace}
            />
            {!canEditWorkspace && (
              <p className="text-xs text-muted-foreground">
                Only owners and admins can change workspace settings.
              </p>
            )}
            <SaveRow
              saving={saving}
              disabled={loading || !canEditWorkspace || !activeWorkspace}
              onCancel={() => setDraft(preferences)}
              onSave={() => {
                if (!activeWorkspace) return;
                savePreferences({
                  workspaceId: activeWorkspace.id,
                  workspaceName: draft.workspaceName,
                });
              }}
            />
            {canRemoveWorkspace && activeWorkspace && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4">
                <p className="text-sm font-bold text-destructive">Delete workspace</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permanently remove “{activeWorkspace.name}” and all of its projects, tasks, files,
                  and team data. This cannot be undone.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleting || loading}
                  onClick={() => setDeleteWorkspaceOpen(true)}
                >
                  {deleting ? "Deleting…" : "Delete workspace"}
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="connected">
          <Card title="Connected accounts" desc="Bring context from the tools you already use.">
            {comingSoonFeature ? <ComingSoonNotice feature={comingSoonFeature} /> : null}
            {connectedAccounts.map((account) => (
              <div
                key={account.key}
                className="flex items-center justify-between rounded-2xl border border-border px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{account.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.desc}</p>
                </div>
                <Button
                  type="button"
                  variant="hero"
                  size="sm"
                  onClick={() => setComingSoonFeature(account.name)}
                >
                  Connect
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDeleteDialog
        open={removeAvatarOpen}
        onOpenChange={setRemoveAvatarOpen}
        title="Remove profile photo?"
        description="Your initials will show instead until you upload a new photo."
        confirmLabel="Remove photo"
        tone="caution"
        pending={avatarBusy}
        onConfirm={() => {
          void runRemoveAvatar();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteWorkspaceOpen}
        onOpenChange={setDeleteWorkspaceOpen}
        title="Delete workspace?"
        description={
          <>
            This permanently removes{" "}
            <DeleteEntityName>{activeWorkspace?.name ?? "this workspace"}</DeleteEntityName> and all
            of its projects, tasks, files, and team data. This cannot be undone.
          </>
        }
        confirmLabel="Delete workspace"
        pending={deleting}
        onConfirm={() => {
          void runDeleteWorkspace();
        }}
      />
    </div>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function FieldInput({
  id,
  label,
  value,
  type = "text",
  onChange,
  disabled,
  readOnly,
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 rounded-2xl"
      />
    </div>
  );
}

function ComingSoonNotice({ feature }: { feature: string }) {
  return (
    <Alert
      role="alert"
      className="border-warning/50 bg-warning/15 text-foreground [&>svg]:text-warning"
    >
      <TriangleAlert />
      <AlertTitle>Coming soon</AlertTitle>
      <AlertDescription>{feature} isn’t available yet. Check back shortly.</AlertDescription>
    </Alert>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange ?? (() => undefined)}
        disabled={Boolean(disabled)}
      />
    </div>
  );
}

function SaveRow({
  saving,
  disabled,
  onCancel,
  onSave,
}: {
  saving?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        disabled={saving}
        onClick={() => {
          onCancel?.();
          toast("Changes discarded");
        }}
      >
        Cancel
      </Button>
      <Button variant="hero" disabled={saving || disabled} onClick={() => onSave?.()}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function AccentPicker({
  value,
  onChange,
}: {
  value: AccentPreference;
  onChange: (accent: AccentPreference) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Accent color</Label>
      <div className="flex flex-wrap gap-3">
        {ACCENTS.map((key) => {
          const theme = ACCENT_THEMES[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                applyAccent(key);
                onChange(key);
              }}
              className="accent-swatch grid size-10 place-items-center rounded-2xl transition-transform hover:scale-110"
              data-accent-swatch={key}
              style={{ background: theme.hex, ["--swatch" as string]: theme.hex }}
              aria-label={`Accent ${theme.name}`}
              aria-pressed={value === key}
            />
          );
        })}
      </div>
    </div>
  );
}
