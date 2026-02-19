# OpenClaw Mission Control 🦅

AI agent orchestration dashboard for Елисей.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Theme: offwhite `#FAF9F6` + orange `#F97316`

## Sections
- **Tasks** — Kanban board with cron jobs as cards (In Progress / Recurring / Backlog)
- **Calendar** — All scheduled automations with schedule & next-run
- **Memory** — Markdown viewer for workspace files (SOUL.md, MEMORY.md, etc)
- **Team** — Agent cards from AGENTS_ROSTER.md

## Running locally (on VPS)

```bash
cd /home/node/.openclaw/workspace/mission-control

# Install deps (note: --include=dev needed for tailwind)
npm install --include=dev

# Start dev server on port 3333
npm run dev
```

## Accessing from Mac

### Option 1: SSH port forward (recommended)
```bash
ssh -L 3333:localhost:3333 user@your-vps-ip
# Then open http://localhost:3333 in your Mac browser
```

### Option 2: Persistent with tmux
```bash
# On VPS
tmux new -s mission-control
cd /home/node/.openclaw/workspace/mission-control
npm run dev
# Ctrl+B, D to detach

# On Mac
ssh -L 3333:localhost:3333 -N user@your-vps-ip &
open http://localhost:3333
```

## Build for production

```bash
npm run build --include=dev
npm start -p 3333
```

> **Note:** On this VPS, `npm` globally omits devDependencies.
> Always use `npm install --include=dev` to get Tailwind CSS.
