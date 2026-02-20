import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CRON_JOBS_PATH = "/home/node/.openclaw/cron/jobs.json";
const WORKSPACE = "/home/node/.openclaw/workspace";

interface RawJob {
  id: string;
  name: string;
  enabled?: boolean;
  schedule?: { kind: string; expr?: string; tz?: string; at?: string };
  payload?: { kind: string; message?: string };
  delivery?: { mode: string };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
  agentId?: string;
  deleteAfterRun?: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleRaw: RawJob["schedule"];
  description: string;
  enabled: boolean;
  agentId?: string;
  lastStatus?: string;
  lastRunAtMs?: number;
  nextRunAtMs?: number;
  isOneShot?: boolean;
  deleteAfterRun?: boolean;
}

function formatSchedule(schedule?: RawJob["schedule"]): string {
  if (!schedule) return "";
  if (schedule.kind === "at" && schedule.at) {
    return `at ${schedule.at}`;
  }
  if (schedule.kind === "cron" && schedule.expr) {
    const tz = schedule.tz ? ` (${schedule.tz})` : "";
    return `${schedule.expr}${tz}`;
  }
  if (schedule.kind === "every") {
    return `every`;
  }
  return JSON.stringify(schedule);
}

function truncate(str: string, len = 120): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

async function readCronJobs(): Promise<{ source: string; jobs: CronJob[] }> {
  // Primary: read directly from OpenClaw cron storage
  try {
    const raw = fs.readFileSync(CRON_JOBS_PATH, "utf-8");
    const data = JSON.parse(raw);
    const rawJobs: RawJob[] = Array.isArray(data) ? data : (data.jobs || []);

    const jobs: CronJob[] = rawJobs.map((j) => ({
      id: j.id,
      name: j.name,
      schedule: formatSchedule(j.schedule),
      scheduleRaw: j.schedule,
      description: truncate(j.payload?.message || ""),
      enabled: j.enabled !== false,
      agentId: j.agentId,
      lastStatus: j.state?.lastStatus,
      lastRunAtMs: j.state?.lastRunAtMs,
      nextRunAtMs: j.state?.nextRunAtMs,
      isOneShot: j.schedule?.kind === "at",
      deleteAfterRun: j.deleteAfterRun,
    }));

    return { source: "openclaw", jobs };
  } catch {
    // fallback: automations.json
  }

  try {
    const filePath = path.join(WORKSPACE, "automations.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const jobs = JSON.parse(raw);
    return {
      source: "automations.json",
      jobs: jobs.map((j: { id: string; name: string; schedule: string; description?: string }) => ({
        id: j.id,
        name: j.name,
        schedule: j.schedule || "",
        description: j.description || "",
        enabled: true,
      })),
    };
  } catch {
    return {
      source: "static",
      jobs: [
        {
          id: "static-1",
          name: "Daily backup",
          schedule: "0 12 * * * (Europe/Warsaw)",
          scheduleRaw: undefined,
          description: "Бэкап workspace в GitHub",
          enabled: true,
        },
      ],
    };
  }
}

export async function GET() {
  const data = await readCronJobs();
  return NextResponse.json(data);
}
