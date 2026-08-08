export type Priority = "Low" | "Medium" | "High" | "Urgent";

export const members = [
  { id: "u1", name: "Ava Mitchell", role: "Owner", initials: "AM", color: "#1A4A6E", email: "ava@syncspace.io", tasks: 34, activity: 96 },
  { id: "u2", name: "Noah Bennett", role: "Admin", initials: "NB", color: "#2D8A9E", email: "noah@syncspace.io", tasks: 27, activity: 88 },
  { id: "u3", name: "Priya Raman", role: "Member", initials: "PR", color: "#5CBDB9", email: "priya@syncspace.io", tasks: 41, activity: 92 },
  { id: "u4", name: "Diego Alvarez", role: "Member", initials: "DA", color: "#2F9E7D", email: "diego@syncspace.io", tasks: 19, activity: 71 },
  { id: "u5", name: "Mia Chen", role: "Admin", initials: "MC", color: "#D9A441", email: "mia@syncspace.io", tasks: 30, activity: 84 },
  { id: "u6", name: "Liam Okafor", role: "Member", initials: "LO", color: "#E07A5F", email: "liam@syncspace.io", tasks: 12, activity: 63 },
];

export const workspaces = [
  { id: "w1", name: "Northwind Studio", plan: "Business", initials: "NS" },
  { id: "w2", name: "Orbit Labs", plan: "Pro", initials: "OL" },
  { id: "w3", name: "Freelance HQ", plan: "Starter", initials: "FH" },
];

export const projects = [
  { id: "p1", name: "Aurora Design System", client: "Northwind Studio", progress: 78, tasks: 46, done: 36, due: "Sep 12", status: "On track", members: ["u1", "u3", "u5"], accent: "#1A4A6E" },
  { id: "p2", name: "Nimbus Mobile App", client: "Orbit Labs", progress: 42, tasks: 62, done: 26, due: "Oct 03", status: "At risk", members: ["u2", "u4", "u6"], accent: "#2D8A9E" },
  { id: "p3", name: "Helios Marketing Site", client: "Helios Inc.", progress: 91, tasks: 28, done: 25, due: "Aug 22", status: "On track", members: ["u1", "u2"], accent: "#5CBDB9" },
  { id: "p4", name: "Quantum Analytics", client: "Quantum Bio", progress: 24, tasks: 55, done: 13, due: "Nov 15", status: "Planning", members: ["u3", "u5", "u6"], accent: "#2F9E7D" },
  { id: "p5", name: "Vertex Onboarding", client: "Vertex Pay", progress: 63, tasks: 31, done: 20, due: "Sep 30", status: "On track", members: ["u4", "u1"], accent: "#D9A441" },
  { id: "p6", name: "Lighthouse Rebrand", client: "Lighthouse Co.", progress: 15, tasks: 24, done: 4, due: "Dec 08", status: "Planning", members: ["u6", "u2", "u3"], accent: "#E07A5F" },
];

export type Task = {
  id: string;
  title: string;
  column: string;
  priority: Priority;
  due: string;
  assignee: string;
  subtasks: [number, number];
  attachments: number;
  comments: number;
  tag: string;
};

export const tasks: Task[] = [
  { id: "t1", title: "Audit legacy color tokens", column: "Backlog", priority: "Low", due: "Sep 02", assignee: "u3", subtasks: [1, 4], attachments: 2, comments: 3, tag: "Design" },
  { id: "t2", title: "Define motion guidelines", column: "Backlog", priority: "Medium", due: "Sep 05", assignee: "u5", subtasks: [0, 3], attachments: 0, comments: 1, tag: "Design" },
  { id: "t3", title: "Realtime presence cursors", column: "Todo", priority: "High", due: "Aug 28", assignee: "u2", subtasks: [2, 6], attachments: 1, comments: 8, tag: "Engineering" },
  { id: "t4", title: "Billing plan comparison table", column: "Todo", priority: "Medium", due: "Aug 30", assignee: "u4", subtasks: [1, 2], attachments: 3, comments: 2, tag: "Growth" },
  { id: "t5", title: "Kanban drag performance pass", column: "In Progress", priority: "Urgent", due: "Aug 24", assignee: "u1", subtasks: [4, 5], attachments: 1, comments: 12, tag: "Engineering" },
  { id: "t6", title: "Onboarding email sequence", column: "In Progress", priority: "Medium", due: "Aug 26", assignee: "u6", subtasks: [2, 4], attachments: 0, comments: 5, tag: "Marketing" },
  { id: "t7", title: "Accessibility contrast sweep", column: "Review", priority: "High", due: "Aug 21", assignee: "u3", subtasks: [5, 5], attachments: 2, comments: 4, tag: "Design" },
  { id: "t8", title: "Workspace switcher analytics", column: "Review", priority: "Low", due: "Aug 23", assignee: "u5", subtasks: [3, 3], attachments: 1, comments: 0, tag: "Product" },
  { id: "t9", title: "Ship v2.4 release notes", column: "Done", priority: "Medium", due: "Aug 14", assignee: "u2", subtasks: [3, 3], attachments: 4, comments: 6, tag: "Product" },
  { id: "t10", title: "Migrate file storage buckets", column: "Done", priority: "High", due: "Aug 11", assignee: "u4", subtasks: [6, 6], attachments: 2, comments: 9, tag: "Engineering" },
];

export const columns = ["Backlog", "Todo", "In Progress", "Review", "Done"];

export const activity = [
  { id: "a1", user: "u3", action: "completed", target: "Accessibility contrast sweep", time: "4m ago" },
  { id: "a2", user: "u2", action: "commented on", target: "Realtime presence cursors", time: "18m ago" },
  { id: "a3", user: "u5", action: "uploaded", target: "brand-guidelines-v4.pdf", time: "42m ago" },
  { id: "a4", user: "u1", action: "moved", target: "Kanban drag performance pass", time: "1h ago" },
  { id: "a5", user: "u6", action: "invited", target: "sam@lighthouse.co", time: "3h ago" },
  { id: "a6", user: "u4", action: "created", target: "Vertex Onboarding sprint 12", time: "5h ago" },
];

export const notifications = [
  { id: "n1", type: "mention", title: "Noah Bennett mentioned you", body: "“@ava can you review the presence spec today?”", time: "2m", unread: true },
  { id: "n2", type: "task", title: "Task moved to Review", body: "Accessibility contrast sweep · Aurora Design System", time: "27m", unread: true },
  { id: "n3", type: "file", title: "New file uploaded", body: "brand-guidelines-v4.pdf · 8.2 MB", time: "1h", unread: true },
  { id: "n4", type: "task", title: "Deadline approaching", body: "Helios Marketing Site is due in 2 days", time: "4h", unread: false },
  { id: "n5", type: "team", title: "Mia Chen joined Orbit Labs", body: "Role set to Admin", time: "1d", unread: false },
];

export const files = [
  { id: "f1", name: "brand-guidelines-v4.pdf", size: "8.2 MB", kind: "PDF", owner: "u5", updated: "Today, 09:41", color: "#C94F4F" },
  { id: "f2", name: "aurora-tokens.json", size: "126 KB", kind: "JSON", owner: "u3", updated: "Yesterday", color: "#1A4A6E" },
  { id: "f3", name: "nimbus-app-flows.fig", size: "44.8 MB", kind: "FIG", owner: "u1", updated: "2 days ago", color: "#2D8A9E" },
  { id: "f4", name: "q3-roadmap.xlsx", size: "612 KB", kind: "XLS", owner: "u2", updated: "3 days ago", color: "#2F9E7D" },
  { id: "f5", name: "onboarding-hero.png", size: "2.4 MB", kind: "PNG", owner: "u6", updated: "5 days ago", color: "#5CBDB9" },
  { id: "f6", name: "investor-update-aug.docx", size: "318 KB", kind: "DOC", owner: "u4", updated: "1 week ago", color: "#D9A441" },
];

export const comments = [
  { id: "c1", user: "u2", time: "2h ago", body: "Pushed the cursor throttling fix — presence now stays under 40ms on a 12-person room.", reactions: [["🔥", 4], ["🚀", 2]] as [string, number][] },
  { id: "c2", user: "u5", time: "1h ago", body: "@Priya Raman can you sanity-check the color contrast on the avatar stack?", reactions: [["👀", 3]] as [string, number][] },
  { id: "c3", user: "u3", time: "24m ago", body: "Checked — AA passes everywhere except the muted timestamp. Bumping it one step.", reactions: [["✅", 5], ["💜", 1]] as [string, number][] },
];

export const weeklyData = [
  { day: "Mon", completed: 18, created: 24 },
  { day: "Tue", completed: 26, created: 21 },
  { day: "Wed", completed: 31, created: 28 },
  { day: "Thu", completed: 24, created: 19 },
  { day: "Fri", completed: 38, created: 30 },
  { day: "Sat", completed: 12, created: 8 },
  { day: "Sun", completed: 9, created: 6 },
];

export const workloadData = members.slice(0, 5).map((m) => ({ name: m.name.split(" ")[0], value: m.tasks, color: m.color }));

export const donutData = [
  { name: "Completed", value: 412, color: "#2F9E7D" },
  { name: "In progress", value: 168, color: "#1A4A6E" },
  { name: "Blocked", value: 46, color: "#D9A441" },
  { name: "Backlog", value: 214, color: "#5CBDB9" },
];

export const testimonials = [
  { quote: "We replaced three tools with SyncSpace in a week. Our sprint velocity went up 34% and nobody misses the old stack.", name: "Ava Mitchell", role: "Head of Product, Northwind Studio" },
  { quote: "The realtime board is genuinely instant. Twelve people editing at once and it never stutters.", name: "Diego Alvarez", role: "Engineering Lead, Orbit Labs" },
  { quote: "As a freelancer, client workspaces made me look like a ten-person agency. Worth every cent.", name: "Priya Raman", role: "Independent Product Designer" },
];

export const faqs = [
  { q: "Can I try SyncSpace before paying?", a: "Every plan starts with a 14-day full-feature trial. No credit card, no feature gates, and your data stays if you upgrade later." },
  { q: "How real is “real-time”?", a: "Presence, cursors, comments and board moves sync over persistent connections with sub-100ms median latency across regions." },
  { q: "Do you support guest access for clients?", a: "Yes. Invite clients as guests with read-only or comment-only permissions scoped to a single project." },
  { q: "Can I migrate from Notion, Linear or ClickUp?", a: "One-click importers bring over documents, issues, statuses and attachments while preserving assignees and history." },
  { q: "What about security and compliance?", a: "SOC 2 Type II, SSO/SAML on Business, granular role permissions, audit logs and regional data residency." },
];

export const plans = [
  { name: "Starter", price: 0, tagline: "For solo builders finding their rhythm.", features: ["1 workspace", "Up to 3 projects", "Kanban + list views", "500 MB storage", "Community support"], cta: "Start free" },
  { name: "Pro", price: 14, tagline: "For teams shipping every single week.", features: ["Unlimited projects", "Realtime collaboration", "Analytics dashboard", "50 GB storage", "Guest client access", "Priority support"], cta: "Start 14-day trial", popular: true },
  { name: "Business", price: 32, tagline: "For scaling orgs that need control.", features: ["Everything in Pro", "SSO / SAML", "Advanced permissions", "Audit logs", "1 TB storage", "Dedicated success manager"], cta: "Talk to sales" },
];

export const memberOf = (id: string) => members.find((m) => m.id === id)!;
