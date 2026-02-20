"use client";

import { useEffect, useState } from "react";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";

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

function formatSchedule(schedule?: { kind: string; expr?: string; tz?: string; at?: string }): string {
  if (!schedule) return "";
  if (schedule.kind === "at" && schedule.at) return `at ${schedule.at}`;
  if (schedule.kind === "cron" && schedule.expr) {
    const tz = schedule.tz ? ` (${schedule.tz})` : "";
    return `${schedule.expr}${tz}`;
  }
  if (schedule.kind === "every") return `every`;
  return JSON.stringify(schedule);
}

function parseCronReadable(expr: string): string {
  if (!expr) return "";
  if (expr.startsWith("at ")) {
    const dt = expr.replace("at ", "");
    try { return new Date(dt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }); }
    catch { return expr; }
  }
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
  return clean;
}

type Column = "Active" | "Scheduled" | "Inactive";

const COLUMN_META: Record<Column, { color: string; bg: string; emoji: string }> = {
  "Active": { color: "#22C55E", bg: "#F0FDF4", emoji: "⚡" },
  "Scheduled": { color: "#F97316", bg: "#FFF7ED", emoji: "⏰" },
  "Inactive": { color: "#78716C", bg: "#F5F5F4", emoji: "⏸" },
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
    files: "#F97316", dev: "#3B82F6", cfo: "#22C55E",
    diet: "#A855F7", research: "#F43F5E", saliba: "#14B8A6",
  };
  return map[agentId || ""] || "#78716C";
}

export default function TasksPage() {
  const { call, status, config } = useGateway();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (status === "unconfigured" || !config) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    call("cron.list", { includeDisabled: true })
      .then((res) => {
        const data = res as { jobs?: unknown[] };
        const rawJobs = data?.jobs || [];
        const mapped: CronJob[] = rawJobs.map((j: unknown) => {
          const job = j as {
            id: string; name: string; enabled?: boolean;
            schedule?: { kind: string; expr?: string; tz?: string; at?: string };
            payload?: { message?: string };
            state?: { lastRunAtMs?: number; nextRunAtMs?: number; lastStatus?: string };
            agentId?: string;
            deleteAfterRun?: boolean;
          };
          return {
            id: job.id,
            name: job.name,
            schedule: formatSchedule(job.schedule),
            scheduleRaw: job.schedule,
            description: job.payload?.message?.slice(0, 120) || "",
            enabled: job.enabled !== false,
            agentId: job.agentId,
            lastStatus: job.state?.lastStatus,
            lastRunAtMs: job.state?.lastRunAtMs,
            nextRunAtMs: job.state?.nextRunAtMs,
            isOneShot: job.schedule?.kind === "at",
            deleteAfterRun: job.deleteAfterRun,
          };
        });
        setJobs(mapped);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [call, status, config]);

  const columns: Column[] = ["Active", "Scheduled", "Inactive"];
  const jobsByColumn: Record<Column, CronJob[]> = { Active: [], Scheduled: [], Inactive: [] };
  jobs.forEach((job) => jobsByColumn[assignColumn(job)].push(job));

  if (status === "unconfigured" || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Gateway not configured</h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm">
          Connect to your OpenClaw Gateway to see cron jobs and automations.
        </p>
        <Link
          href="/settings"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#F97316" }}
        >
          Configure Gateway →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Tasks</h1>
        <p className="text-stone-500 text-sm mt-1">
          Cron jobs · {jobs.length} total
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-orange-400 rounded-full animate-spin" />
          Loading from gateway…
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => {
            const meta = COLUMN_META[col];
            return (
              <div key={col}>
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
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="flex-1 font-semibold text-stone-900 text-sm leading-tight">{job.name}</h3>
                        {job.lastStatus === "ok" && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ ok</span>
                        )}
                        {job.lastStatus === "error" && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">✗ err</span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-stone-500 mb-3 leading-relaxed line-clamp-2">{job.description}</p>
                      )}

                      {job.schedule && (
                        <div
                          className="text-xs font-mono px-2 py-1 rounded-md inline-flex items-center gap-1 mb-2"
                          style={{ background: "#FFF7ED", color: "#F97316" }}
                        >
                          <span>⏱</span> {parseCronReadable(job.schedule)}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        {job.agentId && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                            style={{ background: agentColor(job.agentId) + "15", color: agentColor(job.agentId) }}
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
      )}
    </div>
  );
}
