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

function parseCronReadable(schedule: string): string {
  if (!schedule) return "—";
  if (schedule.startsWith("at ")) {
    const dt = schedule.replace("at ", "");
    try {
      return "One-shot: " + new Date(dt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return schedule;
    }
  }
  const clean = schedule.replace(/\s*\([^)]+\)/, "").trim();
  const tz = schedule.match(/\(([^)]+)\)/)?.[1] || "";
  const parts = clean.split(" ");
  if (parts.length < 5) return schedule;
  const [min, hour, dom, month, dow] = parts;

  if (dom === "*" && month === "*" && dow === "*" && hour !== "*" && min !== "*") {
    return `Every day at ${hour}:${min.padStart(2, "0")}${tz ? ` · ${tz}` : ""}`;
  }
  if (dow !== "*" && dom === "*") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStr = dow.split(",").map((d) => dayNames[parseInt(d)] || d).join(", ");
    return `Every ${dayStr} at ${hour}:${min.padStart(2, "0")}${tz ? ` · ${tz}` : ""}`;
  }
  if (dom !== "*" && month === "*" && dow === "*") {
    return `Monthly (day ${dom}) at ${hour}:${min.padStart(2, "0")}${tz ? ` · ${tz}` : ""}`;
  }
  return clean + (tz ? ` · ${tz}` : "");
}

function formatTime(ms?: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const diff = ms - Date.now();
  const diffAbs = Math.abs(diff);

  if (diffAbs < 60000) return "now";

  if (diff > 0) {
    // future
    const m = Math.round(diff / 60000);
    const h = Math.round(diff / 3600000);
    if (m < 60) return `in ${m}m`;
    if (h < 24) return `in ${h}h`;
    return `in ${Math.round(h / 24)}d`;
  } else {
    // past
    const m = Math.round(diffAbs / 60000);
    const h = Math.round(diffAbs / 3600000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
}

const AGENT_COLORS: Record<string, string> = {
  files: "#F97316",
  dev: "#3B82F6",
  cfo: "#22C55E",
  diet: "#A855F7",
  research: "#F43F5E",
  saliba: "#14B8A6",
};

export default function CalendarPage() {
  const [data, setData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Sort: enabled first, then by nextRunAtMs
  const sorted = [...(data?.jobs || [])].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;
    if (a.nextRunAtMs && b.nextRunAtMs) return a.nextRunAtMs - b.nextRunAtMs;
    return 0;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
        <p className="text-stone-500 text-sm mt-1">
          All scheduled automations · {data?.jobs.length ?? "…"} jobs · Source: <span className="font-mono">{data?.source ?? "…"}</span>
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-orange-400 rounded-full animate-spin" />
          Loading…
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-4">Schedule</div>
          <div className="col-span-2">Next Run</div>
          <div className="col-span-1">Agent</div>
          <div className="col-span-1">Last</div>
        </div>

        {!loading && sorted.length === 0 && (
          <div className="px-6 py-12 text-center text-stone-400">No cron jobs found</div>
        )}

        {sorted.map((job, idx) => {
          const agentColor = AGENT_COLORS[job.agentId || ""] || "#78716C";
          return (
            <div
              key={job.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${
                idx < sorted.length - 1 ? "border-b border-stone-100" : ""
              } hover:bg-stone-50/80 transition-colors`}
            >
              {/* Status dot */}
              <div className="col-span-1">
                {job.enabled ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    {job.isOneShot && (
                      <span className="text-xs text-stone-400" title="One-shot, deletes after run">1×</span>
                    )}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300 inline-block" />
                )}
              </div>

              {/* Name */}
              <div className="col-span-3">
                <div className="font-medium text-stone-900 text-sm leading-tight">{job.name}</div>
                {job.description && (
                  <div className="text-xs text-stone-400 mt-0.5 truncate max-w-48">{job.description}</div>
                )}
              </div>

              {/* Schedule */}
              <div className="col-span-4">
                <code
                  className="text-xs px-2 py-1 rounded-md inline-block"
                  style={{ background: job.enabled ? "#FFF7ED" : "#F5F5F4", color: job.enabled ? "#F97316" : "#78716C" }}
                >
                  {parseCronReadable(job.schedule)}
                </code>
              </div>

              {/* Next run */}
              <div className="col-span-2 text-sm">
                <span className={job.nextRunAtMs && job.nextRunAtMs > Date.now() ? "text-stone-600" : "text-stone-400"}>
                  {formatTime(job.nextRunAtMs)}
                </span>
              </div>

              {/* Agent */}
              <div className="col-span-1">
                {job.agentId && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                    style={{ background: agentColor + "18", color: agentColor }}
                  >
                    {job.agentId}
                  </span>
                )}
              </div>

              {/* Last run status */}
              <div className="col-span-1 text-right">
                {job.lastStatus === "ok" && (
                  <span className="text-xs text-green-600 font-medium">✓</span>
                )}
                {job.lastStatus === "error" && (
                  <span className="text-xs text-red-500 font-medium">✗</span>
                )}
                {job.lastRunAtMs && (
                  <div className="text-xs text-stone-400 mt-0.5">{formatTime(job.lastRunAtMs)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data?.source && (
        <p className="text-xs text-stone-400 mt-4">Data source: {data.source}</p>
      )}
    </div>
  );
}
