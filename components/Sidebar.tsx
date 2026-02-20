"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGateway } from "../context/GatewayContext";

const nav = [
  { href: "/tasks", label: "Tasks", icon: "⬜" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/memory", label: "Memory", icon: "🧠" },
  { href: "/approvals", label: "Approvals", icon: "✅" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/docs", label: "Docs", icon: "📚" },
];

const STATUS_COLORS: Record<string, string> = {
  ok: "#22C55E",
  error: "#EF4444",
  checking: "#F97316",
  unconfigured: "#78716C",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "Connected",
  error: "Error",
  checking: "Connecting…",
  unconfigured: "Not configured",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { status, config } = useGateway();

  const statusColor = STATUS_COLORS[status] || "#78716C";
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <aside
      className="w-56 flex flex-col h-screen shrink-0"
      style={{ background: "#1C1917", color: "#FAF9F6" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦅</span>
          <div>
            <div className="font-bold text-sm text-white leading-tight">OpenClaw</div>
            <div className="text-xs" style={{ color: "#F97316" }}>Mission Control</div>
          </div>
        </div>
      </div>

      {/* Gateway status */}
      <div className="px-5 py-3 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: statusColor,
              boxShadow: status === "ok" ? `0 0 6px ${statusColor}` : "none",
            }}
          />
          <div className="min-w-0">
            <div className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </div>
            {config?.url && (
              <div className="text-xs text-stone-500 truncate font-mono" title={config.url}>
                {new URL(config.url).host}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
              style={active ? { background: "#F97316", color: "#fff" } : {}}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings link */}
      <div className="px-3 pb-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "text-white"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
          }`}
          style={pathname === "/settings" ? { background: "#F97316", color: "#fff" } : {}}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-stone-700">
        <div className="text-xs text-stone-500">v0.2.0</div>
      </div>
    </aside>
  );
}
