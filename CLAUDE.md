# CLAUDE.md — ntfy-channel-ui

## הקשר
פרויקט אישי של Yosef. אתר סטטי (SPA) שמשתמש בערוץ ntfy.sh `dissertation_editor_ysf`
כ-message bus בין user (iPhone/PC), orchestrator (Claude Code בלוקל), וסוכני background.

## אילוצים ועקרונות
- **Static only**: אין backend. כל I/O ישירות מול `https://ntfy.sh` (CORS נתמך).
- **RTL-first**: עברית היא שפת העבודה העיקרית. index.html עם `dir="rtl" lang="he"`.
  טקסט של הודעות עצמן עם `dir="auto"` (עשוי להיות עברית/אנגלית/מעורב).
- **Mobile-first**: ה-use case המרכזי הוא iPhone. כל קומפוננטה חייבת להיראות טוב ב-375px.
- **Minimal deps**: אין React Query, אין Zustand, אין Router. useState + useEffect + custom hooks.
- **Type-safe**: TypeScript strict. אין `any` אלא בגבולות ברורים (external libs ללא types).

## קונבנציית הודעות (routing protocol)
- **Title**: `[FROM->TO] Subject` — לדוגמה `[ORCH->USER] Plan ready`.
  FROM/TO הם בדרך כלל: `USER`, `ORCH`, `AGENT-<שם>` (Dani, Rachel, ...).
- **Tags**: מחרוזת קומה-separated. מוסיפים אוטומטית `from:<sender>`, `to:<recipient>`.
  Tags סמנטיים: `status:done`, `stage:7`, `blocker`, `info`.
- **Priority**: 5=blocking, 4=important, 3=default, 1-2=background.

## ntfy API gotchas
- `/json?poll=1` מחזיר NDJSON — לפרסר **שורה בכל פעם**, לא כ-JSON בודד.
- `/sse` מחזיר SSE; השתמש ב-native EventSource, לא ב-library.
- SSE ב-iOS Safari יוצא מחיבור ברקע — תמיד עם auto-reconnect + exponential backoff.
- Headers חייבים להיות ASCII. לעברית ב-title/message: RFC 2047 `=?UTF-8?B?<base64>?=`
  (ר' `src/lib/ntfy.ts` → `encodeHeaderValue`).
- העלאת קובץ: **PUT**, לא POST. Body = File. Header `Filename`.
- מגבלה בציבורי: 15MB לקובץ, 3 שעות retention לקבצים.

## טסטים ידניים אחרי כל שינוי משמעותי
1. שליחת טקסט בעברית → מופיע נכון בפיד ובאפליקציית ntfy באייפון
2. שליחת קובץ .md → מופיע preview עם עברית מיושרת ימין
3. ניתוק רשת ל-5 שניות ואז חזרה → SSE מתחבר מחדש אוטומטית
4. פתיחת האתר במצב incognito → טעינה של היסטוריית 24h מופיעה

## הסתכלות על הפרויקט
- `src/lib/ntfy.ts` הוא הלב. אם משהו שבור, **שם** הבעיה.
- אל תערבב state של SSE עם state של poll ההיסטוריה — שמור שני arrays נפרדים ומזג לתצוגה.
- תמיד deduplicate לפי `message.id` (SSE עשוי לשלוח הודעה שכבר הייתה ב-history).

## אל תעשה
- אל תפתח WebSocket — ntfy תומך ב-SSE בלבד בצד-הלקוח.
- אל תשתמש ב-`window.btoa` על מחרוזת עברית ישירות — זה יזרוק InvalidCharacterError.
  השתמש ב-`btoa(unescape(encodeURIComponent(text)))`.
- אל תנסה לצרף auth; הפרויקט הזה מניח topic ציבורי. אם נרצה auth בעתיד, מעבר ל-self-hosted.
