import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/home/node/.openclaw/workspace";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  emoji: string;
  specialties: string[];
}

function parseAgentsRoster(content: string): Agent[] {
  const agents: Agent[] = [];
  // Split by "---" or "##" sections
  const sections = content.split(/\n---\n/);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    // Find ## heading
    const headingLine = lines.find((l) => l.startsWith("## "));
    if (!headingLine) continue;

    // Parse "## 🎯 Микель (files) — Orchestrator + General"
    const headingMatch = headingLine.match(/^## (.+)/);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim();
    // Extract emoji
    // Extract first non-ascii chars as emoji (simple heuristic)
    const firstWord = heading.split(" ")[0];
    const emoji = /^[A-Za-z0-9]/.test(firstWord) ? "🤖" : firstWord;

    // Extract name and role
    const nameMatch = heading.match(/^[^\w\s]*\s*(.+?)\s*[—-]/);
    const rolePart = heading.split(/[—-]/);
    const role = rolePart[rolePart.length - 1]?.trim() || "";

    // Find ID line
    const idLine = lines.find((l) => l.includes("**ID:**"));
    const idMatch = idLine?.match(/\*\*ID:\*\*\s*`([^`]+)`/);
    const id = idMatch?.[1] || "";

    // Description: first non-empty paragraph after heading
    let desc = "";
    let foundHeading = false;
    for (const line of lines) {
      if (line.startsWith("## ")) { foundHeading = true; continue; }
      if (!foundHeading) continue;
      if (line.startsWith("#") || line.startsWith("**ID:") || line.startsWith("**Когда")) continue;
      if (line.trim() && !line.startsWith("-") && !line.startsWith("*") && !line.startsWith("`")) {
        desc = line.trim();
        break;
      }
    }

    // Specialties: bullet items under "Когда вызывать"
    const specialties: string[] = [];
    let inWhen = false;
    for (const line of lines) {
      if (line.includes("Когда вызывать") || line.includes("Специализация")) { inWhen = true; continue; }
      if (inWhen && line.startsWith("- ")) {
        specialties.push(line.replace(/^- /, "").trim());
      }
      if (inWhen && !line.startsWith("- ") && line.trim() && !line.includes("Когда")) {
        if (line.startsWith("#") || line.startsWith("**")) inWhen = false;
      }
    }

    if (id || heading.length > 3) {
      agents.push({
        id,
        name: nameMatch?.[1]?.trim() || heading.replace(/^[^\w\s]+\s*/, "").split("—")[0].trim(),
        role,
        description: desc,
        emoji,
        specialties: specialties.slice(0, 4),
      });
    }
  }

  return agents.filter((a) => a.name.length > 0);
}

export async function GET() {
  try {
    // Try AGENTS_ROSTER.md first
    let filePath = path.join(WORKSPACE, "AGENTS_ROSTER.md");
    let content: string;
    
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      filePath = path.join(WORKSPACE, "IDENTITY.md");
      content = fs.readFileSync(filePath, "utf-8");
    }

    const agents = parseAgentsRoster(content);
    return NextResponse.json({ agents, source: path.basename(filePath) });
  } catch {
    // Hardcoded fallback
    return NextResponse.json({
      source: "static",
      agents: [
        {
          id: "files",
          name: "Микель",
          role: "Orchestrator + General",
          description: "Точка входа для всего. Управляет памятью, делегирует специализированным агентам.",
          emoji: "🎯",
          specialties: ["Общие задачи", "Память", "Делегирование"],
        },
        {
          id: "dev",
          name: "Dev Coder",
          role: "Разработка",
          description: "Написать, отревьюить, отладить код. Деплой в GitHub.",
          emoji: "💻",
          specialties: ["Код", "GitHub", "Деплой", "Автоматизации"],
        },
      ],
    });
  }
}
