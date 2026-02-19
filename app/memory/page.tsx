"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FILE_LABELS: Record<string, { emoji: string; desc: string }> = {
  "SOUL.md": { emoji: "✨", desc: "Core identity & mission" },
  "MEMORY.md": { emoji: "🧠", desc: "Long-term curated memory" },
  "AGENTS.md": { emoji: "📋", desc: "Workspace rules & guidelines" },
  "AGENTS_ROSTER.md": { emoji: "👥", desc: "Agent team roster" },
  "IDENTITY.md": { emoji: "🪪", desc: "Identity definition" },
};

export default function MemoryPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files || []);
        if (d.files?.length > 0) {
          setSelected(d.files[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setContent("");
    fetch(`/api/memory?file=${selected}`)
      .then((r) => r.json())
      .then((d) => {
        setContent(d.content || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selected]);

  return (
    <div className="flex gap-6 h-full">
      {/* File list sidebar */}
      <div className="w-52 shrink-0">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Memory</h1>
        <div className="space-y-1">
          {files.map((f) => {
            const meta = FILE_LABELS[f] || { emoji: "📄", desc: "" };
            return (
              <button
                key={f}
                onClick={() => setSelected(f)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected === f
                    ? "font-semibold text-white"
                    : "text-stone-600 hover:bg-stone-100"
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
          <div className="text-stone-400 text-sm py-12 text-center">Loading…</div>
        )}

        {!loading && content && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm max-w-3xl">
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!loading && !content && selected && (
          <div className="text-stone-400 text-sm py-12 text-center">File is empty or not found</div>
        )}
      </div>
    </div>
  );
}
