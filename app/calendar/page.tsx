"use client";

import { useEffect, useState } from "react";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description?: string;
  enabled?: boolean;
  agentId?: string;
  lastStatus?: string;
  lastRunAtMs?: number;
  nextRunAtMs?: number;
  isOneShot?: boolean;
}

function formatSchedule(schedule?: { kind: string; expr?: string; tz?: string; at?: string }): string {
  if (!schedule) return "";
  if (schedule.kind === "at" && schedule.at) return `at ${schedule.at}`;
  if (schedule.kind === "cron" && schedule.expr) {
    const tz = schedule.tz ? ` (${schedule.tz})` : "";
    return `${schedule.expr}${tz}`;
  }
  return JSON.stringify(schedule);
}

function parseCronReadable(schedule: string): string {
  if (!schedule) return "—";
  if (schedule.startsWith("at ")) {
    const dt = schedule.replace("at ", "");
    try { return "One-shot: " + new Date(dt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }); }
    catch { return schedule; }
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
  return clean + (tz ? ` · ${tz}` : "");
}

function formatTime(ms?: number): string {
  if (!ms) return "—";
  const diff = ms - Date.now();
  const diffAbs = Math.abs(diff);
  if (diffAbs < 60000) return "now";
  if (diff > 0) {
    const m = Math.round(diff / 60000);
    const h = Math.round(diff / 3600000);
    if (m < 60) return `in ${m}m`;
    if (h < 24) return `in ${h}h`;
    return `in ${Math.round(h / 24)}d`;
  } else {
    const m = Math.round(diffAbs / 60000);
    const h = Math.round(diffAbs / 3600000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
}

const AGENT_COLORS: Record<string, string> = {
  files: "#F97316", dev: "#3B82F6", cfo: "#22C55E",
  diet: "#A855F7", research: "#F43F5E", saliba: "#14B8A6",
};

export default function CalendarPage() {
  const { call, status, config } = useGateway();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unconfigured" || !config) { setLoading(false); return; }
    setLoading(true);
    call("cron.list", { includeDisabled: true })
      .then((res) => {
        const data = res as { jobs?: unknown[] };
        const mapped: CronJob[] = (data?.jobs || []).map((j: unknown) => {
          const job = j as {
            id: string; name: string; enabled?: boolean;
            schedule?: { kind: string; expr?: string; tz?: string; at?: string };
            payload?: { message?: string };
            state?: { lastRunAtMs?: number; nextRunAtMs?: number; lastStatus?: string };
            agentId?: string;
          };
          return {
            id: job.id,
            name: job.name,
            schedule: formatSchedule(job.schedule),
            description: job.payload?.message?.slice(0, 80) || "",
            enabled: job.enabled !== false,
            agentId: job.agentId,
            lastStatus: job.state?.lastStatus,
            lastRunAtMs: job.state?.lastRunAtMs,
            nextRunAtMs: job.state?.nextRunAtMs,
            isOneShot: job.schedule?.kind === "at",
          };
        });
        setJobs(mapped);
        setLoading(false);
      })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [call, status, config]);

  const sorted = [...jobs].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;
    if (a.nextRunAtMs && b.nextRunAtMs) return a.nextRunAtMs - b.nextRunAtMs;
    return 0;
  });

  if (status === "unconfigured" || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Gateway not configured</h2>
        <Link href="/settings" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#F97316" }}>
          Configure Gateway →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
        <p className="text-stone-500 text-sm mt-1">
          All scheduled automations · {jobs.length} jobs
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-orange-400 rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">⚠️ {error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Schedule</div>
            <div className="col-span-2">Next Run</div>
            <div className="col-span-1">Agent</div>
            <div className="col-span-1">Last</div>
          </div>

          {sorted.length === 0 && (
            <div className="px-6 py-12 text-center text-stone-400">No cron jobs found</div>
          )}

          {sorted.map((job, idx) => {
            const agentColor = AGENT_COLORS[job.agentId || ""] || "#78716C";
            return (
              <div
                key={job.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${idx < sorted.length - 1 ? "border-b border-stone-100" : ""} hover:bg-stone-50/80 transition-colors`}
              >
                <div className="col-span-1">
                  {job.enabled
                    ? <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    : <span className="w-2 h-2 rounded-full bg-stone-300 inline-block" />}
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-stone-900 text-sm">{job.name}</div>
                  {job.description && (
                    <div className="text-xs text-stone-400 mt-0.5 truncate">{job.description}</div>
                  )}
                </div>
                <div className="col-span-4">
                  <code className="text-xs px-2 py-1 rounded-md inline-block" style={{ background: job.enabled ? "#FFF7ED" : "#F5F5F4", color: job.enabled ? "#F97316" : "#78716C" }}>
                    {parseCronReadable(job.schedule)}
                  </code>
                </div>
                <div className="col-span-2 text-sm">
                  <span className={job.nextRunAtMs && job.nextRunAtMs > Date.now() ? "text-stone-600" : "text-stone-400"}>
                    {formatTime(job.nextRunAtMs)}
                  </span>
                </div>
                <div className="col-span-1">
                  {job.agentId && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: agentColor + "18", color: agentColor }}>
                      {job.agentId}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  {job.lastStatus === "ok" && <span className="text-xs text-green-600 font-medium">✓</span>}
                  {job.lastStatus === "error" && <span className="text-xs text-red-500 font-medium">✗</span>}
                  {job.lastRunAtMs && <div className="text-xs text-stone-400 mt-0.5">{formatTime(job.lastRunAtMs)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
