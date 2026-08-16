import type { AnalyticsDashboard, AnalyticsRange } from "@/services/analytics.service";
import { RANGE_LABELS } from "@/services/analytics.service";

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rangeLabel(range: AnalyticsRange) {
  return RANGE_LABELS.find((item) => item.value === range)?.label ?? range;
}

/**
 * Opens a print-ready analytics report. Users can Save as PDF from the browser print dialog.
 */
export function exportAnalyticsPdf(input: {
  workspaceName: string;
  range: AnalyticsRange;
  data: AnalyticsDashboard;
}) {
  const { workspaceName, range, data } = input;
  const generated = data.generated_at
    ? new Date(data.generated_at).toLocaleString()
    : new Date().toLocaleString();
  const label = rangeLabel(range);

  const kpiRows = [
    ["Tasks completed", `${data.stats.tasks_completed}`, data.stats.tasks_completed_delta],
    ["Avg. cycle time", `${data.stats.avg_cycle_time}d`, data.stats.cycle_time_delta],
    ["On-time delivery", `${data.stats.on_time_delivery}%`, data.stats.on_time_delta],
    ["Active collaborators", `${data.stats.active_collaborators}`, data.stats.collaborators_delta],
  ];

  const statusRows = data.status_breakdown
    .map(
      (slice) =>
        `<tr><td>${escapeHtml(slice.name)}</td><td style="text-align:right">${slice.value}</td></tr>`,
    )
    .join("");

  const workloadRows = data.workload
    .map(
      (slice) =>
        `<tr><td>${escapeHtml(slice.name)}</td><td style="text-align:right">${slice.value}</td></tr>`,
    )
    .join("");

  const projectRows = data.project_health
    .map(
      (project) =>
        `<tr>
          <td>${escapeHtml(project.name)}</td>
          <td>${escapeHtml(project.status)}</td>
          <td style="text-align:right">${project.progress}%</td>
          <td style="text-align:right">${project.done}/${project.tasks}</td>
        </tr>`,
    )
    .join("");

  const dueRows = data.due_today
    .slice(0, 12)
    .map(
      (task) =>
        `<tr>
          <td>${escapeHtml(task.title)}</td>
          <td>${escapeHtml(task.assignee?.name || "Unassigned")}</td>
          <td>${escapeHtml(task.due || "—")}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SyncSpace Analytics — ${escapeHtml(workspaceName)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.45; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 28px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    p.meta { color: #6b7280; margin: 0 0 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0 8px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }
    .card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .card .value { font-size: 24px; font-weight: 750; margin-top: 4px; }
    .card .delta { font-size: 12px; color: #059669; margin-top: 2px; }
    .score { font-size: 36px; font-weight: 800; margin: 0; }
    @media print {
      body { margin: 16px; }
      h2 { break-after: avoid; }
      table, .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(workspaceName)} — Analytics</h1>
  <p class="meta">Range: ${escapeHtml(label)} · Generated ${escapeHtml(generated)} · Productivity score ${data.productivity_score}</p>

  <div class="grid">
    ${kpiRows
      .map(
        ([labelText, value, delta]) => `
      <div class="card">
        <div class="label">${escapeHtml(String(labelText))}</div>
        <div class="value">${escapeHtml(String(value))}</div>
        <div class="delta">${escapeHtml(String(delta))} vs previous period</div>
      </div>`,
      )
      .join("")}
  </div>

  <h2>Status breakdown</h2>
  <table>
    <thead><tr><th>Status</th><th style="text-align:right">Tasks</th></tr></thead>
    <tbody>${statusRows || `<tr><td colspan="2">No data</td></tr>`}</tbody>
  </table>

  <h2>Workload</h2>
  <table>
    <thead><tr><th>Member</th><th style="text-align:right">Tasks</th></tr></thead>
    <tbody>${workloadRows || `<tr><td colspan="2">No data</td></tr>`}</tbody>
  </table>

  <h2>Project health</h2>
  <table>
    <thead>
      <tr>
        <th>Project</th>
        <th>Status</th>
        <th style="text-align:right">Progress</th>
        <th style="text-align:right">Done</th>
      </tr>
    </thead>
    <tbody>${projectRows || `<tr><td colspan="4">No projects</td></tr>`}</tbody>
  </table>

  <h2>Due today</h2>
  <table>
    <thead><tr><th>Task</th><th>Assignee</th><th>Due</th></tr></thead>
    <tbody>${dueRows || `<tr><td colspan="3">Nothing due today</td></tr>`}</tbody>
  </table>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to export the PDF report.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
