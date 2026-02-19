"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/tasks", label: "Tasks", icon: "⬜" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/memory", label: "Memory", icon: "🧠" },
  { href: "/team", label: "Team", icon: "👥" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex flex-col h-screen"
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

      {/* Footer */}
      <div className="px-5 py-4 border-t border-stone-700">
        <div className="text-xs text-stone-500">v0.1.0 MVP</div>
      </div>
    </aside>
  );
}
