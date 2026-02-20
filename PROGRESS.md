# Mission Control — Progress

## Session: GSD 2026-02-20

### ✅ Completed

#### Diagnostics
- **Root cause found**: `NODE_ENV=production` set globally in OpenClaw environment. When `next dev` runs with `NODE_ENV=production`, Next.js skips development CSS processing (PostCSS/Tailwind loaders not applied) → CSS file parsed as raw module → `Module parse failed: Unexpected token`.
- **Fix**: Dev script now uses `NODE_ENV=development next dev -p 3333` in `package.json`.

#### Config Fixes
- Removed duplicate `next.config.ts` (not supported by Next.js 14.2.x — throws error)
- Created `next.config.mjs` with correct `experimental.serverComponentsExternalPackages: ["ws"]`
- Downgraded `tailwindcss` from v4.2.0 → v3.4.19 (v4 changed PostCSS plugin structure; Next.js 14 natively supports v3)
- Created `tailwind.config.ts` for content scanning
- Fixed `postcss.config.mjs` to use `{ tailwindcss: {}, autoprefixer: {} }` (v3 standard)
- Added `@tailwindcss/postcss` (v4 plugin) to deps — this can be removed later as v3 is now used

#### New Pages
- `/approvals` — Approval queue UI with filter tabs (pending/all/approved/rejected), card layout, approve/reject buttons. Shows "all caught up" state when empty. Placeholder for future Gateway API integration.
- `/docs` — Document viewer with file list sidebar, reads files from `agents.files.get` API. Shows PLANNING.md, TASKS.md, PROGRESS.md, README.md.

#### Navigation
- Sidebar updated from 4 items to 6: Tasks, Calendar, Memory, **Approvals**, Team, **Docs**

#### GSD Documents
- `PLANNING.md` — Architecture, stack, design decisions, feature roadmap
- `TASKS.md` — Task list with priorities and statuses
- `PROGRESS.md` — This file

### 🚀 Verification

All pages verified working with `curl` (HTTP 200):
- `/tasks` — Kanban board ✅
- `/calendar` — Cron schedule table ✅
- `/memory` — File viewer ✅
- `/approvals` — Approval queue (new) ✅
- `/team` — Agent roster ✅
- `/docs` — Document viewer (new) ✅
- `/settings` — Gateway config ✅
- `/` — Redirects to `/tasks` ✅

### ❌ Not Done / Issues

1. **Approvals API** — No Gateway API exists yet for approvals. Page is a placeholder.
2. **Memory edit mode** — Read-only currently. No save-back functionality.
3. **Real-time updates** — Pages fetch once on load. No WebSocket event subscription.
4. **@tailwindcss/postcss** still in `package.json` — was installed during debugging, not needed with v3. Can remove.
5. **npm audit** — 20 vulnerabilities (1 moderate, 19 high). Non-critical for local dev tool.

### How to Run

```bash
# From mission-control directory:
npm run dev
# Server starts at http://localhost:3333

# If NODE_ENV issue persists:
NODE_ENV=development npx next dev -p 3333
```

The dev script in `package.json` now handles this automatically.

### Git Status

After this session, all changes committed and pushed to `main`.
