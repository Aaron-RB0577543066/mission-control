"use client";

import { useEffect, useState } from "react";
import { useGateway } from "../../context/GatewayContext";
import Link from "next/link";

interface Approval {
  id: string;
  title: string;
  description: string;
  agentId: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
  metadata?: Record<string, unknown>;
}

const AGENT_COLORS: Record<string, string> = {
  files: "#F97316", dev: "#3B82F6", cfo: "#22C55E",
  diet: "#A855F7", research: "#F43F5E", saliba: "#14B8A6",
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60000);
  const h = Math.round(diff / 3600000);
  const d = Math.round(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function ApprovalsPage() {
  const { status, config } = useGateway();
  const [approvals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  if (status === "unconfigured" || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Gateway not configured</h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm">
          Connect to your OpenClaw Gateway to see agent approval requests.
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

  const filtered = approvals.filter(a => filter === "all" ? true : a.status === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Approvals</h1>
        <p className="text-stone-500 text-sm mt-1">
          Agent decision approval queue · {approvals.filter(a => a.status === "pending").length} pending
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "all", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize"
            style={filter === f
              ? { background: "#F97316", color: "#fff" }
              : { background: "#F5F5F4", color: "#78716C" }
            }
          >
            {f}
            {f === "pending" && approvals.filter(a => a.status === "pending").length > 0 && (
              <span className="ml-1.5 text-xs bg-white/25 px-1.5 py-0.5 rounded-full">
                {approvals.filter(a => a.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">
            {filter === "pending" ? "🎉" : "📭"}
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">
            {filter === "pending" ? "All caught up!" : "Nothing here"}
          </h3>
          <p className="text-stone-400 text-sm max-w-sm">
            {filter === "pending"
              ? "No pending approvals. Agents are working autonomously."
              : `No ${filter} approvals found.`}
          </p>
        </div>
      )}

      {/* Approval cards */}
      <div className="space-y-4">
        {filtered.map((approval) => {
          const agentColor = AGENT_COLORS[approval.agentId] || "#78716C";
          return (
            <div
              key={approval.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-mono font-medium"
                      style={{ background: agentColor + "15", color: agentColor }}
                    >
                      {approval.agentId}
                    </span>
                    <span className="text-xs text-stone-400">{timeAgo(approval.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-stone-900">{approval.title}</h3>
                  <p className="text-sm text-stone-500 mt-1 leading-relaxed">{approval.description}</p>
                </div>

                {approval.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "#22C55E" }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {approval.status !== "pending" && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                    style={approval.status === "approved"
                      ? { background: "#F0FDF4", color: "#15803D" }
                      : { background: "#FEF2F2", color: "#DC2626" }
                    }
                  >
                    {approval.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming soon note */}
      <div className="mt-8 p-4 rounded-xl border border-stone-200 bg-stone-50 text-center">
        <p className="text-sm text-stone-500">
          🔌 Approvals integration with OpenClaw Gateway is coming soon.
          Agents will be able to request human approval before taking sensitive actions.
        </p>
      </div>
    </div>
  );
}
