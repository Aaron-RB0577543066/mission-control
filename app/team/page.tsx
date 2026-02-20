"use client";

import { useEffect, useState } from "react";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  role?: string;
  emoji?: string;
  description?: string;
  specialties?: string[];
}

const ACCENT_COLORS = [
  { bg: "#FFF7ED", border: "#FED7AA", text: "#F97316" },
  { bg: "#EFF6FF", border: "#BFDBFE", text: "#3B82F6" },
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#22C55E" },
  { bg: "#FDF4FF", border: "#E9D5FF", text: "#A855F7" },
  { bg: "#FFF1F2", border: "#FECDD3", text: "#F43F5E" },
  { bg: "#F0FDFA", border: "#99F6E4", text: "#14B8A6" },
];

const AGENT_EMOJIS: Record<string, string> = {
  files: "🎯", dev: "💻", cfo: "📊", diet: "🥗", research: "🔍", saliba: "🧑‍💼",
};

export default function TeamPage() {
  const { call, status, config } = useGateway();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unconfigured" || !config) { setLoading(false); return; }
    setLoading(true);
    call("agents.list", {})
      .then((res) => {
        const data = res as {
          agents?: Array<{
            id: string;
            name?: string;
            identity?: { name?: string; theme?: string };
          }>;
        };
        const rawAgents = data?.agents || [];
        const mapped: Agent[] = rawAgents.map((a) => ({
          id: a.id,
          name: a.identity?.name || a.name || a.id,
          emoji: AGENT_EMOJIS[a.id] || "🤖",
          role: resolveRole(a.id),
          description: resolveDesc(a.id),
          specialties: resolveSpecialties(a.id),
        }));
        setAgents(mapped);
        setLoading(false);
      })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [call, status, config]);

  if (status === "unconfigured" || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">👥</div>
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
        <h1 className="text-2xl font-bold text-stone-900">Team</h1>
        <p className="text-stone-500 text-sm mt-1">AI agents roster</p>
      </div>

      {loading && <div className="text-stone-400 text-sm">Loading…</div>}
      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">⚠️ {error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((agent, idx) => {
          const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
          return (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: color.border }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: color.bg }}
                >
                  {agent.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-lg leading-tight">{agent.name}</h3>
                  {agent.role && (
                    <div className="text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ background: color.bg, color: color.text }}>
                      {agent.role}
                    </div>
                  )}
                </div>
              </div>

              {agent.description && (
                <p className="text-sm text-stone-500 leading-relaxed mb-4">{agent.description}</p>
              )}

              {agent.specialties && agent.specialties.length > 0 && (
                <div>
                  <div className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Specialties</div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.specialties.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5F5F4", color: "#78716C" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <code className="text-xs text-stone-400 font-mono">id: {agent.id}</code>
                <div className="w-2 h-2 rounded-full" style={{ background: color.text }} />
              </div>
            </div>
          );
        })}
      </div>

      {agents.length === 0 && !loading && !error && (
        <div className="text-center py-20 text-stone-400">
          <div className="text-4xl mb-4">👥</div>
          <div>No agents found</div>
        </div>
      )}
    </div>
  );
}

// Local lookup tables for known agent metadata
function resolveRole(id: string): string {
  const roles: Record<string, string> = {
    files: "Orchestrator + General", dev: "Development", cfo: "Finance",
    diet: "Nutrition", research: "Research", saliba: "PM Mentoring",
  };
  return roles[id] || "Agent";
}

function resolveDesc(id: string): string {
  const descs: Record<string, string> = {
    files: "Entry point for everything. Manages memory, delegates to specialists.",
    dev: "Write, review, debug code. Deploy to GitHub.",
    cfo: "Polish taxes, mortgage, investments, budget.",
    diet: "Dietly menu analysis, macros, nutrition recommendations.",
    research: "Deep multi-source research with verification.",
    saliba: "PM sparring, interview prep, Agile frameworks.",
  };
  return descs[id] || "";
}

function resolveSpecialties(id: string): string[] {
  const specs: Record<string, string[]> = {
    files: ["General tasks", "Memory", "Delegation", "Research"],
    dev: ["Code", "GitHub", "Deploy", "Automations"],
    cfo: ["Taxes (PIT, ZUS)", "Investments", "Budget"],
    diet: ["Macros", "Dietly", "Nutrition"],
    research: ["Research", "Fact-checking", "Trends"],
    saliba: ["PM cases", "Interviews", "Agile", "Templates"],
  };
  return specs[id] || [];
}
