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

function buildReportHtml(input: {
  workspaceName: string;
  range: AnalyticsRange;
  data: AnalyticsDashboard;
}) {
  const { workspaceName, range, data } = input;
  const generated = data.generated_at
    ? new Date(data.generated_at).toLocaleString()
    : new Date().toLocaleString();
  const label = rangeLabel(range);
  const stats = data.stats;

  const kpiRows = [
    ["Tasks completed", `${stats.tasks_completed}`, stats.tasks_completed_delta],
    ["Avg. cycle time", `${stats.avg_cycle_time}d`, stats.cycle_time_delta],
    ["On-time delivery", `${stats.on_time_delivery}%`, stats.on_time_delta],
    ["Active collaborators", `${stats.active_collaborators}`, stats.collaborators_delta],
  ];

  const statusRows = (data.status_breakdown ?? [])
    .map(
      (slice) =>
        `<tr><td>${escapeHtml(slice.name)}</td><td style="text-align:right">${slice.value}</td></tr>`,
    )
    .join("");

  const workloadRows = (data.workload ?? [])
    .map(
      (slice) =>
        `<tr><td>${escapeHtml(slice.name)}</td><td style="text-align:right">${slice.value}</td></tr>`,
    )
    .join("");

  const projectRows = (data.project_health ?? [])
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

  const dueRows = (data.due_today ?? [])
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(workspaceName)} — Analytics (${escapeHtml(label)})</title>
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
</body>
</html>`;
}

/**
 * Opens the browser print dialog for the analytics report (Save as PDF).
 * Uses a hidden iframe so we never rely on window.open + noopener (which returns null).
 * Resolves when the print dialog closes (or after a short fallback timeout).
 */
export function exportAnalyticsPdf(input: {
  workspaceName: string;
  range: AnalyticsRange;
  data: AnalyticsDashboard;
}): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("PDF export is only available in the browser."));
  }
  if (!input.data?.stats) {
    return Promise.reject(new Error("Analytics data is still loading. Try again in a moment."));
  }

  const html = buildReportHtml(input);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Analytics PDF export");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument ?? frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    return Promise.reject(new Error("Could not prepare the PDF report. Try again."));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      frameWindow.removeEventListener("afterprint", finish);
      window.removeEventListener("afterprint", finish);
      cleanup();
      resolve();
    };

    // Backup for browsers where print() returns before the dialog closes.
    frameWindow.addEventListener("afterprint", finish);
    window.addEventListener("afterprint", finish);

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    window.setTimeout(() => {
      try {
        frameWindow.focus();
        // In most browsers this blocks until the print dialog is closed.
        frameWindow.print();
        // Clear the loading toast as soon as the dialog returns
        // (afterprint often never fires on hidden iframes).
        finish();
      } catch {
        cleanup();
        if (!settled) {
          settled = true;
          frameWindow.removeEventListener("afterprint", finish);
          window.removeEventListener("afterprint", finish);
          reject(new Error("Could not open the print dialog."));
        }
      }
    }, 300);
  });
}
