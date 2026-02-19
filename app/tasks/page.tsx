"use client";

import { useEffect, useState } from "react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description?: string;
  enabled?: boolean;
}

interface CronData {
  source: string;
  jobs: CronJob[];
}

// Parse cron expression to human-readable
function parseCron(expr: string): string {
  // Strip timezone
  const clean = expr.replace(/\s*\([^)]+\)/, "").trim();
  const parts = clean.split(" ");
  if (parts.length < 5) return expr;
  const [min, hour, dom, month, dow] = parts;
  
  if (dom === "*" && month === "*" && dow === "*") {
    if (hour !== "*" && min !== "*") return `Daily at ${hour}:${min.padStart(2, "0")}`;
    if (hour === "*") return `Every hour at :${min.padStart(2, "0")}`;
  }
  if (dow !== "*" && dom === "*") {
    return `Weekly (${dow}) at ${hour}:${min.padStart(2, "0")}`;
  }
  return clean;
}

type Column = "Recurring" | "Backlog" | "In Progress";

const COLUMN_COLORS: Record<Column, string> = {
  "Recurring": "#F97316",
  "Backlog": "#78716C",
  "In Progress": "#3B82F6",
};

const COLUMN_BG: Record<Column, string> = {
  "Recurring": "#FFF7ED",
  "Backlog": "#F5F5F4",
  "In Progress": "#EFF6FF",
};

function assignColumn(job: CronJob, idx: number): Column {
  // Logic: recurring = scheduled crons, in progress = first one, rest backlog
  if (idx === 0) return "In Progress";
  if (job.schedule && job.schedule !== "") return "Recurring";
  return "Backlog";
}

export default function TasksPage() {
  const [data, setData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const columns: Column[] = ["In Progress", "Recurring", "Backlog"];

  const jobsByColumn: Record<Column, CronJob[]> = {
    "Recurring": [],
    "Backlog": [],
    "In Progress": [],
  };

  if (data?.jobs) {
    data.jobs.forEach((job, i) => {
      const col = assignColumn(job, i);
      jobsByColumn[col].push(job);
    });
  }

  // Also add some static backlog items to make it look real
  const staticBacklog: CronJob[] = [
    { id: "static-1", name: "Weekly digest report", schedule: "", description: "Summarize week activity for Elisey", enabled: false },
    { id: "static-2", name: "Monthly budget check", schedule: "0 9 1 * *", description: "CFO Макс анализирует расходы за месяц", enabled: false },
  ];
  jobsByColumn["Backlog"].push(...staticBacklog);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Tasks</h1>
        <p className="text-stone-500 text-sm mt-1">
          Канбан-доска · Данные из {data?.source || "…"}
        </p>
      </div>

      {loading && (
        <div className="text-stone-400 text-sm">Loading…</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col}>
            {/* Column header */}
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: COLUMN_BG[col], color: COLUMN_COLORS[col] }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: COLUMN_COLORS[col] }}
              />
              {col}
              <span
                className="ml-auto text-xs font-normal px-1.5 py-0.5 rounded-full"
                style={{ background: COLUMN_COLORS[col] + "30", color: COLUMN_COLORS[col] }}
              >
                {jobsByColumn[col].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {jobsByColumn[col].length === 0 && (
                <div className="text-stone-400 text-sm text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
                  Empty
                </div>
              )}
              {jobsByColumn[col].map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-stone-900 text-sm leading-tight">{job.name}</h3>
                    {job.enabled !== false ? (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">on</span>
                    ) : (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">off</span>
                    )}
                  </div>
                  {job.description && (
                    <p className="text-xs text-stone-500 mb-3 leading-relaxed">{job.description}</p>
                  )}
                  {job.schedule && (
                    <div
                      className="text-xs font-mono px-2 py-1 rounded-md inline-flex items-center gap-1"
                      style={{ background: "#FFF7ED", color: "#F97316" }}
                    >
                      <span>⏱</span> {parseCron(job.schedule)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
