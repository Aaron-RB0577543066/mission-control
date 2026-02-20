"use client";

import { useEffect, useState } from "react";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocFile {
  name: string;
  path: string;
  agentId: string;
  emoji: string;
  description: string;
}

const DOCS: DocFile[] = [
  { name: "README.md", path: "README.md", agentId: "files", emoji: "📖", description: "Project overview" },
  { name: "PLANNING.md", path: "PLANNING.md", agentId: "dev", emoji: "🗺️", description: "Architecture & planning" },
  { name: "TASKS.md", path: "TASKS.md", agentId: "dev", emoji: "✅", description: "Task list with priorities" },
  { name: "PROGRESS.md", path: "PROGRESS.md", agentId: "dev", emoji: "📊", description: "Progress tracker" },
];

const AGENT_COLORS: Record<string, string> = {
  files: "#F97316", dev: "#3B82F6", cfo: "#22C55E",
  diet: "#A855F7", research: "#F43F5E", saliba: "#14B8A6",
};

export default function DocsPage() {
  const { call, status, config } = useGateway();
  const [selected, setSelected] = useState<DocFile>(DOCS[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unconfigured" || !config) return;
    setLoading(true);
    setContent("");
    setError("");

    call("agents.files.get", { agentId: "files", name: selected.path })
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
        <div className="text-4xl mb-4">📚</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Gateway not configured</h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm">
          Connect to your OpenClaw Gateway to browse docs and content.
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
    <div className="flex gap-6 h-full">
      {/* File list sidebar */}
      <div className="w-56 shrink-0">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Docs</h1>

        <div className="space-y-1">
          {DOCS.map((doc) => {
            const agentColor = AGENT_COLORS[doc.agentId] || "#78716C";
            const isSelected = selected.name === doc.name;
            return (
              <button
                key={doc.name}
                onClick={() => setSelected(doc)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={isSelected
                  ? { background: "#F97316", color: "#fff" }
                  : {}
                }
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">{doc.emoji}</span>
                  <div>
                    <div className="font-medium leading-tight">{doc.name}</div>
                    <div className={`text-xs mt-0.5 ${isSelected ? "text-orange-100" : "text-stone-400"}`}>
                      {doc.description}
                    </div>
                    <span
                      className="text-xs font-mono mt-1 inline-block px-1.5 py-0.5 rounded"
                      style={isSelected
                        ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                        : { background: agentColor + "15", color: agentColor }
                      }
                    >
                      {doc.agentId}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            Documents are read from the files agent workspace via Gateway.
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{selected.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{selected.name}</h2>
            <p className="text-sm text-stone-400">{selected.description}</p>
          </div>
        </div>

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
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm max-w-4xl">
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!loading && !error && !content && (
          <div className="text-stone-400 text-sm py-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            File is empty or not found
          </div>
        )}
      </div>
    </div>
  );
}
