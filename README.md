# 🦅 OpenClaw Mission Control

A lightweight local dashboard for monitoring and managing OpenClaw AI agents, cron jobs, and workspace memory.

**Stack:** Next.js 14 · Tailwind CSS  
**Theme:** Offwhite + Orange accent  
**Port:** `3333`

---

## Sections

| Section | Description |
|---------|-------------|
| **Tasks** | Kanban board of cron jobs (Active / Scheduled / Inactive) |
| **Calendar** | Full list of all scheduled automations with timing |
| **Memory** | Viewer for workspace files (SOUL.md, MEMORY.md, etc.) |
| **Team** | Agent roster visualization from AGENTS_ROSTER.md |

---

## Running locally (on VPS via SSH)

### 1. SSH tunnel from your Mac

```bash
ssh -L 3333:localhost:3333 user@your-vps-ip -N
```

Replace `user@your-vps-ip` with your actual VPS SSH credentials.

### 2. Start the dev server (on VPS)

```bash
cd /home/node/.openclaw/workspace/mission-control
npm run dev
```

Or run in the OpenClaw container:

```bash
podman exec -it openclaw-agent bash -c "cd /home/node/.openclaw/workspace/mission-control && npm run dev"
```

### 3. Open in browser

Navigate to: **http://localhost:3333**

---

## Data Sources

- **Cron jobs:** `/home/node/.openclaw/cron/jobs.json` (real-time OpenClaw data)
- **Workspace files:** `/home/node/.openclaw/workspace/*.md` (read directly from filesystem)
- **Agent roster:** `AGENTS_ROSTER.md` in workspace

---

## Project Structure

```
mission-control/
├── app/
│   ├── api/
│   │   ├── cron/route.ts      # Cron jobs API
│   │   ├── memory/route.ts    # File reader API
│   │   └── team/route.ts      # Agent roster API
│   ├── tasks/page.tsx         # Kanban board
│   ├── calendar/page.tsx      # Schedule list
│   ├── memory/page.tsx        # Markdown viewer
│   ├── team/page.tsx          # Agent cards
│   ├── Sidebar.tsx            # Navigation
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── Sidebar.tsx
├── package.json
└── README.md
```

---

Built overnight by the OpenClaw agent team 🤖
