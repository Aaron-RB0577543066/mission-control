import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/home/node/.openclaw/workspace";

// Try OpenClaw API first, fallback to automations.json
async function getCronJobs() {
  // Try OpenClaw gateway ports
  const ports = [3001, 3000, 18789, 18792];
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/api/cron/jobs`, {
        signal: AbortSignal.timeout(1000),
      });
      if (res.ok) {
        const data = await res.json();
        return { source: "api", jobs: data };
      }
    } catch {
      // try next
    }
  }

  // Fallback: read automations.json
  try {
    const filePath = path.join(WORKSPACE, "automations.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const jobs = JSON.parse(raw);
    return { source: "file", jobs };
  } catch {
    // Hardcoded fallback
    return {
      source: "static",
      jobs: [
        {
          id: "1",
          name: "Daily Aaron backup to GitHub",
          schedule: "0 12 * * *",
          description: "Ежедневный бэкап workspace в GitHub репозиторий aaron-memory",
          enabled: true,
        },
        {
          id: "2",
          name: "Dietly menu tomorrow",
          schedule: "0 19 * * *",
          description: "Получает меню из dietly.pl и отправляет Елисею в Telegram",
          enabled: true,
        },
      ],
    };
  }
}

export async function GET() {
  const data = await getCronJobs();
  return NextResponse.json(data);
}
