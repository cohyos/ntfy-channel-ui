# תוכנית פיתוח — `ntfy-channel-ui`

> Web UI סטטי (SPA) לקריאה/כתיבה/העברת קבצים מול ערוץ `ntfy.sh/dissertation_editor_ysf`, תוך תמיכה מלאה בעברית ובזרימת orchestrator↔agent↔user.

## מטרה
SPA שמתארחת כאתר סטטי (GitHub Pages), מאפשרת:
1. **קריאה חיה** (live feed) של הודעות מהערוץ
2. **כתיבה** — שליחת הודעות טקסט עם כותרת, עדיפות, tags, ו-routing prefix `[FROM->TO]`
3. **העלאת קבצים** — שליחת קובץ כ-attachment לערוץ
4. **קריאת קבצים מצורפים** — תצוגה inline של טקסט/Markdown/JSON/CSV/תמונות/PDF/DOCX

## Stack
- Vite + React 18 + TypeScript (strict)
- Tailwind CSS + tailwindcss-rtl
- shadcn/ui (Dialog, Tabs, Button, Input, Toast, Select)
- lucide-react (icons)
- react-markdown + remark-gfm
- mammoth (docx → html) — dynamic import
- vite-plugin-pwa
- Deploy: GitHub Pages via GitHub Actions

## ntfy endpoints
| פעולה                | Endpoint                                     | שיטה | הערות                          |
|----------------------|---------------------------------------------|------|--------------------------------|
| Live stream          | `/<topic>/sse`                              | GET  | EventSource native             |
| Poll history         | `/<topic>/json?poll=1&since=24h`            | GET  | NDJSON - parse line by line    |
| שליחת טקסט           | `/<topic>`                                  | POST | body = text, headers = meta    |
| שליחת קובץ           | `/<topic>`                                  | PUT  | body = File, header `Filename` |

## פייזים
- **Phase 0** — Bootstrap
- **Phase 1** — API client + types
- **Phase 2** — Feed view (stream + history + dedupe)
- **Phase 3** — Compose text
- **Phase 4** — Upload attachment
- **Phase 5** — File preview (md/json/img/pdf/docx)
- **Phase 6** — PWA + Settings + theme + shortcuts
- **Phase 7** — Deploy to GitHub Pages

## routing protocol
- Title: `[FROM->TO] Subject` — parsed in UI
- Tags: `from:<sender>`, `to:<recipient>`, semantic (`status:done`, `blocker`, ...)
- Priority: 5=blocking, 4=important, 3=default, 1-2=background

## Gotchas
- ASCII-only HTTP headers → encode Hebrew via RFC 2047
- SSE disconnects on iOS Safari background → auto-reconnect + visibilitychange fetch
- Deduplicate by `id` between SSE and history
- GitHub Pages base path: `/ntfy-channel-ui/`
