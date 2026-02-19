"use client";

import { useEffect, useState } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  emoji: string;
  specialties: string[];
}

const ACCENT_COLORS = [
  { bg: "#FFF7ED", border: "#FED7AA", text: "#F97316" },
  { bg: "#EFF6FF", border: "#BFDBFE", text: "#3B82F6" },
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#22C55E" },
  { bg: "#FDF4FF", border: "#E9D5FF", text: "#A855F7" },
  { bg: "#FFF1F2", border: "#FECDD3", text: "#F43F5E" },
  { bg: "#F0FDFA", border: "#99F6E4", text: "#14B8A6" },
];

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents || []);
        setSource(d.source || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Team</h1>
        <p className="text-stone-500 text-sm mt-1">
          AI agents roster · {source && `from ${source}`}
        </p>
      </div>

      {loading && <div className="text-stone-400 text-sm">Loading…</div>}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((agent, idx) => {
          const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
          return (
            <div
              key={agent.id || idx}
              className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: color.border }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: color.bg }}
                >
                  {agent.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-lg leading-tight">{agent.name}</h3>
                  <div
                    className="text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {agent.role}
                  </div>
                </div>
              </div>

              {/* Description */}
              {agent.description && (
                <p className="text-sm text-stone-500 leading-relaxed mb-4">
                  {agent.description}
                </p>
              )}

              {/* Specialties */}
              {agent.specialties?.length > 0 && (
                <div>
                  <div className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">
                    Specialties
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.specialties.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#F5F5F4", color: "#78716C" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ID badge */}
              {agent.id && (
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <code className="text-xs text-stone-400 font-mono">id: {agent.id}</code>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: color.text }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {agents.length === 0 && !loading && (
        <div className="text-center py-20 text-stone-400">
          <div className="text-4xl mb-4">👥</div>
          <div>No agents found in roster</div>
        </div>
      )}
    </div>
  );
}
