"use client";

import { useEffect, useState } from "react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleRaw?: { kind: string; expr?: string; tz?: string; at?: string };
  description?: string;
  enabled?: boolean;
  agentId?: string;
  lastStatus?: string;
  lastRunAtMs?: number;
  nextRunAtMs?: number;
  isOneShot?: boolean;
  deleteAfterRun?: boolean;
}

interface CronData {
  source: string;
  jobs: CronJob[];
}

function parseCronReadable(expr: string): string {
  if (!expr) return "";
  // Handle "at <ISO>" for one-shot
  if (expr.startsWith("at ")) {
    const dt = expr.replace("at ", "");
    try {
      return new Date(dt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return expr;
    }
  }
  // Strip timezone annotation
  const clean = expr.replace(/\s*\([^)]+\)/, "").trim();
  const parts = clean.split(" ");
  if (parts.length < 5) return expr;
  const [min, hour, dom, month, dow] = parts;
  const tz = expr.match(/\(([^)]+)\)/)?.[1] || "UTC";

  if (dom === "*" && month === "*" && dow === "*" && hour !== "*" && min !== "*") {
    return `Daily ${hour}:${min.padStart(2, "0")} ${tz}`;
  }
  if (dow !== "*" && dom === "*") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayList = dow.split(",").map((d) => dayNames[parseInt(d)] || d).join(", ");
    return `Weekly (${dayList}) ${hour}:${min.padStart(2, "0")}`;
  }
  if (dom !== "*" && month === "*" && dow === "*") {
    return `Monthly day ${dom} at ${hour}:${min.padStart(2, "0")}`;
  }
  return clean;
}

type Column = "Active" | "Scheduled" | "Inactive";

const COLUMN_META: Record<Column, { color: string; bg: string; emoji: string; desc: string }> = {
  "Active": { color: "#22C55E", bg: "#F0FDF4", emoji: "⚡", desc: "Running & enabled" },
  "Scheduled": { color: "#F97316", bg: "#FFF7ED", emoji: "⏰", desc: "Upcoming one-shots" },
  "Inactive": { color: "#78716C", bg: "#F5F5F4", emoji: "⏸", desc: "Disabled" },
};

function assignColumn(job: CronJob): Column {
  if (!job.enabled) return "Inactive";
  if (job.isOneShot) return "Scheduled";
  return "Active";
}

function timeAgo(ms?: number): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60000);
  const h = Math.round(diff / 3600000);
  const d = Math.round(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function agentColor(agentId?: string): string {
  const map: Record<string, string> = {
    files: "#F97316",
    dev: "#3B82F6",
    cfo: "#22C55E",
    diet: "#A855F7",
    research: "#F43F5E",
    saliba: "#14B8A6",
  };
  return map[agentId || ""] || "#78716C";
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

  const columns: Column[] = ["Active", "Scheduled", "Inactive"];

  const jobsByColumn: Record<Column, CronJob[]> = {
    "Active": [],
    "Scheduled": [],
    "Inactive": [],
  };

  if (data?.jobs) {
    data.jobs.forEach((job) => {
      jobsByColumn[assignColumn(job)].push(job);
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Tasks</h1>
        <p className="text-stone-500 text-sm mt-1">
          Cron jobs · Source: <span className="font-mono text-stone-600">{data?.source || "…"}</span>
          {data?.jobs && (
            <span className="ml-2 text-stone-400">({data.jobs.length} total)</span>
          )}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-orange-400 rounded-full animate-spin" />
          Loading…
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => {
          const meta = COLUMN_META[col];
          return (
            <div key={col}>
              {/* Column header */}
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.color + "30" }}
              >
                <span>{meta.emoji}</span>
                <span>{col}</span>
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: meta.color + "20", color: meta.color }}
                >
                  {jobsByColumn[col].length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {jobsByColumn[col].length === 0 && (
                  <div className="text-stone-400 text-xs text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
                    {col === "Scheduled" ? "No one-shot tasks" : col === "Inactive" ? "All systems go 🟢" : "No active jobs"}
                  </div>
                )}

                {jobsByColumn[col].map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    {/* Job name & status */}
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="flex-1 font-semibold text-stone-900 text-sm leading-tight">{job.name}</h3>
                      {job.lastStatus === "ok" && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ ok</span>
                      )}
                      {job.lastStatus === "error" && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">✗ err</span>
                      )}
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-xs text-stone-500 mb-3 leading-relaxed line-clamp-2">{job.description}</p>
                    )}

                    {/* Schedule badge */}
                    {job.schedule && (
                      <div
                        className="text-xs font-mono px-2 py-1 rounded-md inline-flex items-center gap-1 mb-2"
                        style={{ background: "#FFF7ED", color: "#F97316" }}
                      >
                        <span>⏱</span> {parseCronReadable(job.schedule)}
                      </div>
                    )}

                    {/* Footer: agent + last run */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      {job.agentId && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                          style={{
                            background: agentColor(job.agentId) + "15",
                            color: agentColor(job.agentId),
                          }}
                        >
                          {job.agentId}
                        </span>
                      )}
                      {job.lastRunAtMs && (
                        <span className="text-xs text-stone-400 ml-auto">{timeAgo(job.lastRunAtMs)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
