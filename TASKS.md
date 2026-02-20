# Mission Control — Tasks

Last updated: 2026-02-20

## 🔴 Critical (Blockers)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fix CSS not loading in dev | ✅ Done | Root cause: `NODE_ENV=production` env var. Fixed dev script to set `NODE_ENV=development`. |
| 2 | Fix next.config.ts not supported | ✅ Done | Next.js 14 doesn't support `.ts` config. Renamed to `.mjs`. |
| 3 | Fix Tailwind v4 → v3 downgrade | ✅ Done | v4 has different PostCSS plugin structure. Downgraded to v3. |

## 🟠 High Priority

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4 | Create Approvals page | ✅ Done | Placeholder with UX; awaiting Gateway API |
| 5 | Create Docs page | ✅ Done | Reads files via Gateway agent API |
| 6 | Add Approvals + Docs to Sidebar nav | ✅ Done | 6-item nav now complete |
| 7 | Write GSD documents | ✅ Done | PLANNING.md, TASKS.md, PROGRESS.md |
| 8 | Git commit + push | 🔄 Pending | After all changes |

## 🟡 Medium Priority

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | Memory page: Edit mode | ⬜ Todo | Allow editing workspace files |
| 10 | Tasks: Toggle cron enable/disable | ⬜ Todo | Button on task card |
| 11 | Calendar: Edit schedules inline | ⬜ Todo | Modal or inline form |
| 12 | Approvals: Connect real API | ⬜ Todo | Waiting for Gateway support |
| 13 | Real-time WebSocket events | ⬜ Todo | Auto-refresh on cron run |

## 🟢 Low Priority

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | Dark mode toggle | ⬜ Todo | CSS variable swap |
| 15 | Mobile responsive layout | ⬜ Todo | Sidebar collapse |
| 16 | Agent logs viewer | ⬜ Todo | Last N runs per agent |
| 17 | Remove @tailwindcss/postcss dep | ⬜ Todo | Accidentally added, can clean up |
| 18 | Audit fix for npm vulnerabilities | ⬜ Todo | 20 vulnerabilities (1 moderate, 19 high) |

## ✅ Completed This Session

1. Diagnosed CSS parse failure (NODE_ENV=production conflicts with Next.js dev CSS loader)
2. Fixed PostCSS config (Tailwind v3 + autoprefixer)
3. Fixed next.config (renamed .ts → .mjs, fixed invalid option)
4. Created `/approvals` page with pending/approved/rejected filter UI
5. Created `/docs` page with file browser + markdown viewer
6. Updated Sidebar with full 6-section navigation
7. Verified all 6 pages return HTTP 200
8. Created PLANNING.md, TASKS.md, PROGRESS.md
