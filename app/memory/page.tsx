"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";

const FILES = ["SOUL.md", "MEMORY.md", "AGENTS.md", "USER.md", "TOOLS.md"];

const FILE_LABELS: Record<string, { emoji: string; desc: string }> = {
  "SOUL.md": { emoji: "✨", desc: "Core identity & mission" },
  "MEMORY.md": { emoji: "🧠", desc: "Long-term curated memory" },
  "AGENTS.md": { emoji: "📋", desc: "Workspace rules & guidelines" },
  "USER.md": { emoji: "👤", desc: "User profile" },
  "TOOLS.md": { emoji: "🔧", desc: "Tool configurations" },
};

export default function MemoryPage() {
  const { call, status, config } = useGateway();
  const [selected, setSelected] = useState(FILES[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unconfigured" || !config) return;
    if (!selected) return;
    setLoading(true);
    setContent("");
    setError("");

    // Use agents.files.get to read a workspace file
    call("agents.files.get", { agentId: "files", name: selected })
      .then((res) => {
        const data = res as { content?: string };
        setContent(data?.content || "");
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [call, selected, status, config]);

  if (status === "unconfigured" || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">🧠</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Gateway not configured</h2>
        <Link href="/settings" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#F97316" }}>
          Configure Gateway →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* File list sidebar */}
      <div className="w-52 shrink-0">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Memory</h1>
        <div className="space-y-1">
          {FILES.map((f) => {
            const meta = FILE_LABELS[f] || { emoji: "📄", desc: "" };
            return (
              <button
                key={f}
                onClick={() => setSelected(f)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected === f ? "font-semibold text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
                style={selected === f ? { background: "#F97316" } : {}}
              >
                <div className="flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <div>
                    <div className="font-medium leading-tight">{f.replace(".md", "")}</div>
                    {meta.desc && (
                      <div className={`text-xs mt-0.5 ${selected === f ? "text-orange-100" : "text-stone-400"}`}>
                        {meta.desc}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {selected && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{FILE_LABELS[selected]?.emoji || "📄"}</span>
            <div>
              <h2 className="text-xl font-bold text-stone-900">{selected}</h2>
              <p className="text-sm text-stone-400">{FILE_LABELS[selected]?.desc}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-stone-400 text-sm py-8">
            <div className="w-4 h-4 border-2 border-stone-200 border-t-orange-400 rounded-full animate-spin" />
            Loading…
          </div>
        )}

        {error && !loading && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && content && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm max-w-3xl">
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!loading && !error && !content && (
          <div className="text-stone-400 text-sm py-12 text-center">File is empty or not found</div>
        )}
      </div>
    </div>
  );
}
