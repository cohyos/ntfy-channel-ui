# ntfy-channel-ui

Web UI סטטי (SPA) לקריאה/כתיבה/העברת קבצים מול ערוץ `ntfy.sh/dissertation_editor_ysf`, עם תמיכה מלאה בעברית RTL ובזרימת orchestrator↔agent↔user.

## אתר חי

**https://cohyos.github.io/ntfy-channel-ui/**

(עולה אוטומטית מ-GitHub Actions אחרי push ל-`main`; ר' [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).)

## מה יש כאן

- **פיד חי** — SSE מול ntfy.sh עם חיבור מחדש אוטומטי, merge עם היסטוריה של 24 שעות אחרונות, dedup לפי `id`.
- **כתיבה** — טופס עם FROM/TO presets, נושא, הודעה, tags, עדיפות. כותרת בפורמט `[FROM->TO] Subject`.
- **קבצים** — העלאה דרך כפתור או drag-and-drop (עד 15MB ב-ntfy.sh). תצוגה מקדימה ל-markdown, JSON, CSV, TXT, תמונות, PDF ו-DOCX (דרך `mammoth` עם dynamic import).
- **RTL-first** — ממשק בעברית, טקסט הודעות עם `dir="auto"` כך שעברית/אנגלית/מעורב מיושרים נכון.
- **PWA** — ניתן להתקנה במסך הבית של iOS ו-Android.
- **Theme** — מצב בהיר/כהה נשמר ב-localStorage.
- **הגדרות** — ניתן להחליף topic ו-server URL (לתמיכה ב-ntfy self-hosted בעתיד), ייצוא/ייבוא הגדרות כ-JSON.
- **קיצורי מקלדת** — `f`=פיד, `c`=כתיבה, `s`=הגדרות, `Esc`=סגור דיאלוג.

## פיתוח מקומי

```bash
npm install
npm run dev       # dev server ב-http://localhost:5173/ntfy-channel-ui/
npm run build     # production bundle ב-dist/
npm run preview   # תצוגה מקומית של ה-build
npm run typecheck
npm run icons     # ייצר מחדש icons (דורש sharp)
```

## התקנה כ-PWA באייפון

1. פתח את האתר ב-**Safari** (לא Chrome באייפון — שם זה לא יתקין כ-PWA אמיתי).
2. הקש על כפתור ה-Share (התיבה עם החץ למעלה).
3. גלול למטה ובחר **Add to Home Screen**.
4. האייקון יופיע במסך הבית; הפעלה תפתח במצב standalone (ללא סרגל הכתובת).

## אזהרת אבטחה

ב-ntfy.sh הציבורי, **שם ה-topic הוא הסיסמה היחידה**. כל מי שיודע אותו יכול לקרוא וגם לכתוב. בחר שם קשה לניחוש (כמו `dissertation_editor_ysf`), ואל תשתף אותו במקומות פומביים. אם נדרש auth אמיתי — השתמש ב-ntfy self-hosted עם Basic Auth.

## ארכיטקטורה

- `src/lib/ntfy.ts` — `NtfyClient` עם `streamMessages` (SSE + exp backoff), `fetchHistory` (NDJSON), `publishText` / `publishJson` (fallback) / `publishFile`.
- `src/lib/parseRouting.ts` — פרסינג של כותרות `[FROM->TO] Subject`.
- `src/lib/bidi.ts` — heuristics לזיהוי כיוון טקסט ו-markdown.
- `src/lib/fileReaders.ts` — dispatch לפי mime/ext לסוג preview.
- `src/hooks/useNtfyFeed.ts` — ניהול state של הפיד (history + stream + visibility gap-fill).
- `src/hooks/useSettings.ts` — הגדרות ב-localStorage עם broadcast בין ה-instances.
- `src/components/` — Feed, MessageCard, Compose, Settings, AttachmentPreview, FilterBar.

לפרטים נוספים ראה `PLAN.md` ו-`CLAUDE.md`.

## Deploy

ה-workflow ב-`.github/workflows/deploy.yml` רץ בכל push ל-`main`:

1. `npm ci && npm run build`
2. upload `dist/` כ-artifact
3. deploy ל-GitHub Pages via `actions/deploy-pages@v4`

הפעלה ראשונית דורשת:
- Settings → Pages → Source: **GitHub Actions**

ה-base path של Vite מכוון ל-`/ntfy-channel-ui/` ב-`vite.config.ts`. אם שם הריפו שונה — עדכן שם.

## Gotchas שנתקלנו בהם

- HTTP headers חייבים להיות ASCII. כותרות בעברית עוברות דרך `encodeHeaderValue` (RFC 2047 encoded-word).
- SSE ב-iOS Safari יוצא מהחיבור ברקע לאחר ~30s. ה-hook מטפל בזה עם auto-reconnect + `visibilitychange` שמושך את מה שפספסנו.
- `poll=1` מחזיר NDJSON. חובה לפרסר שורה-בשורה, לא כ-JSON בודד.

## רישיון

MIT
