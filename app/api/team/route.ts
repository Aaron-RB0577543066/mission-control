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

function extractEmoji(str: string): string {
  // Find first emoji-like char (non-ASCII, non-letter) at the start
  const chars = [...str];
  const emojis = [];
  for (const ch of chars) {
    if (ch.trim() === "") break;
    if (/^[A-Za-z0-9]$/.test(ch)) break;
    emojis.push(ch);
  }
  return emojis.length > 0 ? emojis.join("") : "🤖";
}

function stripEmoji(str: string): string {
  // Remove leading non-ASCII, non-letter characters and whitespace
  return str.replace(/^[^\w\s\u00C0-\u024F]+\s*/g, "").trim();
}

function parseAgentsRoster(content: string): Agent[] {
  const agents: Agent[] = [];

  // Split on "---" dividers between agent sections
  const sections = content.split(/\n---\n/);

  for (const section of sections) {
    const lines = section.trim().split("\n");

    // Find ## heading (agent section)
    const headingLine = lines.find((l) => l.startsWith("## "));
    if (!headingLine) continue;

    // e.g. "## 🎯 Микель (files) — Orchestrator + General"
    const headingRaw = headingLine.replace(/^## /, "").trim();

    // Skip "планируемые" / table sections
    if (headingRaw.toLowerCase().includes("планируемые") || headingRaw.toLowerCase().includes("правила")) continue;

    const emoji = extractEmoji(headingRaw);
    const withoutEmoji = stripEmoji(headingRaw);

    // Split on em-dash to get name and role
    const dashSplit = withoutEmoji.split(/\s*—\s*/);
    const namePart = dashSplit[0]?.trim() || withoutEmoji;
    let role = dashSplit.slice(1).join(" — ").trim();

    // If no role from heading, try **Специализация:** line
    if (!role) {
      const specLine = lines.find((l) => l.includes("Специализация:"));
      const specMatch = specLine?.match(/Специализация:\*\*\s*(.+)/);
      if (specMatch) role = specMatch[1].trim();
    }

    // Remove "(id)" from name, e.g. "Микель (files)" → name="Микель", id="files"
    const idMatch = namePart.match(/\(([^)]+)\)/);
    const id = idMatch?.[1] || "";
    const name = namePart.replace(/\s*\([^)]+\)/, "").trim();

    // Look for **ID:** line as backup
    const idLine = lines.find((l) => l.includes("**ID:**"));
    const idFromLine = idLine?.match(/\*\*ID:\*\*\s*`([^`]+)`/)?.[1] || id;

    // Find description: first non-empty paragraph after heading that's not a metadata line
    let description = "";
    let passedHeading = false;
    for (const line of lines) {
      if (line.startsWith("## ")) { passedHeading = true; continue; }
      if (!passedHeading) continue;
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Skip metadata lines
      if (trimmed.startsWith("**") || trimmed.startsWith("#") || trimmed.startsWith("-") || trimmed.startsWith("`") || trimmed.startsWith("|")) continue;
      description = trimmed;
      break;
    }

    // Specialties: bullet items under "Когда вызывать" / "Специализация" section
    const specialties: string[] = [];
    let inSpecSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/когда вызывать|специализация|делегирует когда/i.test(trimmed)) {
        inSpecSection = true;
        continue;
      }
      if (inSpecSection) {
        if (trimmed.startsWith("- ")) {
          specialties.push(trimmed.replace(/^- /, "").trim());
        } else if (trimmed.startsWith("#") || /\*\*[^*]+:\*\*/.test(trimmed)) {
          inSpecSection = false;
        }
      }
    }

    if (!name || name.length === 0) continue;

    agents.push({
      id: idFromLine || id,
      name,
      role,
      description,
      emoji,
      specialties: specialties.slice(0, 5),
    });
  }

  return agents;
}

export async function GET() {
  try {
    // Try AGENTS_ROSTER.md first
    let fileName = "AGENTS_ROSTER.md";
    let filePath = path.join(WORKSPACE, fileName);
    let content: string;

    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      fileName = "IDENTITY.md";
      filePath = path.join(WORKSPACE, fileName);
      content = fs.readFileSync(filePath, "utf-8");
    }

    const agents = parseAgentsRoster(content);

    if (agents.length === 0) {
      throw new Error("No agents parsed");
    }

    return NextResponse.json({ agents, source: fileName });
  } catch {
    // Hardcoded fallback from AGENTS_ROSTER.md
    return NextResponse.json({
      source: "static",
      agents: [
        {
          id: "files",
          name: "Микель",
          role: "Orchestrator + General",
          description: "Точка входа для всего. Управляет памятью, делегирует специализированным агентам.",
          emoji: "🎯",
          specialties: ["Общие задачи", "Память", "Делегирование", "Ресёрч"],
        },
        {
          id: "dev",
          name: "Dev Coder",
          role: "Разработка",
          description: "Написать, отревьюить, отладить код. Деплой в GitHub.",
          emoji: "💻",
          specialties: ["Код", "GitHub", "Деплой", "Автоматизации"],
        },
        {
          id: "cfo",
          name: "CFO Макс",
          role: "Финансы",
          description: "Польские налоги, ипотека, инвестиции, бюджет.",
          emoji: "📊",
          specialties: ["Налоги (PIT, ZUS)", "Инвестиции", "Бюджет"],
        },
        {
          id: "diet",
          name: "Пьер",
          role: "Питание",
          description: "Анализ меню Dietly, КБЖУ, рекомендации по питанию.",
          emoji: "🥗",
          specialties: ["КБЖУ", "Dietly", "Макросы"],
        },
        {
          id: "research",
          name: "Тео",
          role: "Ресёрч",
          description: "Глубокий многоисточниковый ресёрч с верификацией.",
          emoji: "🔍",
          specialties: ["Исследования", "Факт-чекинг", "Тренды"],
        },
        {
          id: "saliba",
          name: "Saliba",
          role: "PM Mentoring",
          description: "Sparring по PM-вопросам, подготовка к интервью, Agile-фреймворки.",
          emoji: "🧑‍💼",
          specialties: ["PM-кейсы", "Интервью", "Agile", "Шаблоны"],
        },
      ],
    });
  }
}
