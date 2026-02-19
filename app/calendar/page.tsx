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

function parseCron(expr: string): string {
  const clean = expr.replace(/\s*\([^)]+\)/, "").trim();
  const parts = clean.split(" ");
  if (parts.length < 5) return expr;
  const [min, hour, dom, month, dow] = parts;

  if (dom === "*" && month === "*" && dow === "*" && hour !== "*" && min !== "*") {
    const tz = expr.match(/\(([^)]+)\)/)?.[1] || "UTC";
    return `Every day at ${hour}:${min.padStart(2, "0")} (${tz})`;
  }
  if (dow !== "*" && dom === "*") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayList = dow.split(",").map((d) => dayNames[parseInt(d)] || d).join(", ");
    return `Every ${dayList} at ${hour}:${min.padStart(2, "0")}`;
  }
  if (dom !== "*" && month === "*" && dow === "*") {
    return `Monthly on day ${dom} at ${hour}:${min.padStart(2, "0")}`;
  }
  return clean;
}

function nextRun(schedule: string): string {
  if (!schedule) return "—";
  const clean = schedule.replace(/\s*\([^)]+\)/, "").trim();
  const parts = clean.split(" ");
  if (parts.length < 5) return "—";
  const [min, hour] = parts;
  
  const now = new Date();
  const next = new Date();
  next.setHours(parseInt(hour), parseInt(min), 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  
  const diff = Math.round((next.getTime() - now.getTime()) / 60000);
  if (diff < 60) return `in ${diff}m`;
  return `in ${Math.round(diff / 60)}h`;
}

export default function CalendarPage() {
  const [data, setData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
        <p className="text-stone-500 text-sm mt-1">Scheduled automations & cron jobs</p>
      </div>

      {loading && <div className="text-stone-400 text-sm">Loading…</div>}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wide">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Schedule</div>
          <div className="col-span-2">Next Run</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1"></div>
        </div>

        {data?.jobs.length === 0 && !loading && (
          <div className="px-6 py-12 text-center text-stone-400">No cron jobs found</div>
        )}

        {data?.jobs.map((job, idx) => (
          <div
            key={job.id}
            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${
              idx < (data?.jobs.length || 0) - 1 ? "border-b border-stone-100" : ""
            } hover:bg-stone-50 transition-colors`}
          >
            <div className="col-span-4">
              <div className="font-medium text-stone-900 text-sm">{job.name}</div>
              {job.description && (
                <div className="text-xs text-stone-400 mt-0.5 truncate">{job.description}</div>
              )}
            </div>
            <div className="col-span-4">
              <code
                className="text-xs px-2 py-1 rounded-md"
                style={{ background: "#FFF7ED", color: "#F97316" }}
              >
                {parseCron(job.schedule)}
              </code>
            </div>
            <div className="col-span-2 text-sm text-stone-500">
              {nextRun(job.schedule)}
            </div>
            <div className="col-span-1">
              {job.enabled !== false ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  On
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                  Off
                </span>
              )}
            </div>
            <div className="col-span-1 text-right">
              <span className="text-xs text-stone-300">#{idx + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {data?.source && (
        <p className="text-xs text-stone-400 mt-4">Source: {data.source}</p>
      )}
    </div>
  );
}
