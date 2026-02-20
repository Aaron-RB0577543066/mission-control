# Mission Control — Planning

## Overview

**Mission Control** is a local Next.js 14 dashboard for orchestrating and monitoring OpenClaw AI agents. It connects to the OpenClaw Gateway via WebSocket RPC and displays real-time data about agents, cron jobs, memory files, and more.

## Stack

- **Framework:** Next.js 14.2.35 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3 (utility classes) + plain CSS variables in `globals.css`
  - Theme: offwhite `#FAF9F6` + orange accent `#F97316`
  - Sidebar: dark stone `#1C1917`
- **Runtime:** Node.js v22
- **Port:** 3333 (dev and prod)
- **Gateway comm:** WebSocket JSON-RPC via server-side proxy at `/api/gateway-proxy`
- **Auth storage:** Browser localStorage (`mc_gateway_url`, `mc_gateway_token`)

## Architecture

```
Browser (Next.js client)
  └── GatewayContext (React context, localStorage persistence)
        └── gatewayFetch() → POST /api/gateway-proxy
              └── Next.js server-side proxy (route handler)
                    └── WebSocket → OpenClaw Gateway
```

### Key Files

```
app/
  layout.tsx          — Root layout with Sidebar + GatewayProvider
  globals.css         — CSS variables, reset, markdown styles
  page.tsx            — Redirects to /tasks
  tasks/page.tsx      — Kanban board: Active / Scheduled / Inactive
  calendar/page.tsx   — All cron jobs in tabular view
  memory/page.tsx     — Workspace file viewer (SOUL, MEMORY, etc.)
  approvals/page.tsx  — Agent approval queue (placeholder)
  team/page.tsx       — Agent roster
  docs/page.tsx       — Document viewer
  settings/page.tsx   — Gateway URL + token config
  api/gateway-proxy/route.ts — Server-side WS proxy

components/
  Sidebar.tsx         — Navigation sidebar

context/
  GatewayContext.tsx  — Global gateway state + call() helper

lib/
  gateway.ts          — localStorage config, fetch wrapper
```

## Design Decisions

1. **Server-side WS proxy** — Browser can't connect to WS Gateway directly (CORS, origin). Next.js API route acts as bridge.
2. **Tailwind via local build** — Tailwind v3 + PostCSS. Previously attempted CDN; switched to local build for reliability.
3. **Plain CSS for custom styles** — Markdown rendering, CSS variables in `globals.css`. Tailwind utilities used in JSX.
4. **NODE_ENV fix** — OpenClaw sets `NODE_ENV=production` globally; dev script overrides with `NODE_ENV=development` to ensure CSS loaders work.
5. **next.config.mjs** — Must use `.mjs` extension (Next.js 14 doesn't support `.ts` configs).

## Navigation Sections

| Route | Status | Description |
|-------|--------|-------------|
| `/tasks` | ✅ Working | Kanban of cron jobs (Active/Scheduled/Inactive) |
| `/calendar` | ✅ Working | All cron jobs list with schedule |
| `/memory` | ✅ Working | File viewer (SOUL.md, MEMORY.md, etc.) |
| `/approvals` | 🟡 Placeholder | Agent approval queue |
| `/team` | ✅ Working | Agent roster from `agents.list` |
| `/docs` | 🟡 Placeholder | Document viewer |
| `/settings` | ✅ Working | Gateway connection config |

## TODO / Feature Roadmap

### High Priority
- [ ] Approvals: Connect to real Gateway API (when available)
- [ ] Tasks: Add ability to enable/disable cron jobs
- [ ] Tasks: One-shot job creation UI
- [ ] Memory: Edit mode for workspace files (save back via API)
- [ ] Calendar: Edit cron schedules inline

### Medium Priority
- [ ] Real-time updates via WebSocket events (not just polling)
- [ ] Docs: Support browsing all workspace files, not just predefined list
- [ ] Team: Show agent status (online/offline/busy)
- [ ] Agent logs viewer (last N runs)

### Low Priority
- [ ] Dark mode toggle
- [ ] Mobile-responsive layout
- [ ] Export data (CSV/JSON)
- [ ] Keyboard shortcuts
