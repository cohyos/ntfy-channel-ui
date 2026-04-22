import { useState } from 'react';
import { Moon, Sun, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from './ui/Toast';

export default function Settings() {
  const { settings, update, reset, exportJson, importJson } = useSettings();
  const { show } = useToast();
  const [topic, setTopic] = useState(settings.topic);
  const [server, setServer] = useState(settings.server);

  const save = () => {
    const t = topic.trim();
    const s = server.trim().replace(/\/$/, '');
    if (!t) {
      show('error', 'topic לא יכול להיות ריק');
      return;
    }
    if (!/^https?:\/\//.test(s)) {
      show('error', 'server חייב להתחיל ב-http:// או https://');
      return;
    }
    update({ topic: t, server: s });
    show('success', 'ההגדרות נשמרו');
  };

  const doExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ntfy-channel-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const text = await f.text();
      if (importJson(text)) {
        show('success', 'ההגדרות יובאו');
      } else {
        show('error', 'JSON לא תקין');
      }
    };
    input.click();
  };

  const doReset = () => {
    if (confirm('לאפס להגדרות ברירת המחדל?')) {
      reset();
      setTopic('dissertation_editor_ysf');
      setServer('https://ntfy.sh');
      show('info', 'ההגדרות אופסו');
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <h2 className="font-semibold mb-2">חיבור</h2>
        <Field label="ntfy server">
          <input
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="input"
            dir="ltr"
            placeholder="https://ntfy.sh"
          />
        </Field>
        <Field label="topic">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input"
            dir="ltr"
            placeholder="dissertation_editor_ysf"
          />
        </Field>
        <button
          type="button"
          onClick={save}
          className="mt-1 px-4 py-2 rounded-md font-medium"
          style={{ background: '#1e3a8a', color: '#fff' }}
        >
          שמור
        </button>
      </section>

      <section
        className="rounded-md p-3 flex gap-2 text-sm"
        style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
      >
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>אבטחה:</strong> שם ה-topic הוא הסיסמה היחידה בערוץ ציבורי ב-ntfy.sh.
          כל מי שיודע אותו יכול לקרוא ולכתוב. בחר שם קשה לניחוש.
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">נושא (Theme)</h2>
        <div className="flex gap-2">
          <ThemeButton
            active={settings.theme === 'light'}
            onClick={() => update({ theme: 'light' })}
            icon={<Sun size={16} />}
            label="בהיר"
          />
          <ThemeButton
            active={settings.theme === 'dark'}
            onClick={() => update({ theme: 'dark' })}
            icon={<Moon size={16} />}
            label="כהה"
          />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">גיבוי הגדרות</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Download size={14} /> ייצוא JSON
          </button>
          <button
            type="button"
            onClick={doImport}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Upload size={14} /> ייבוא JSON
          </button>
          <button
            type="button"
            onClick={doReset}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border"
            style={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            <RotateCcw size={14} /> איפוס
          </button>
        </div>
      </section>

      <section className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <p>קיצורי מקלדת: f=פיד, c=כתיבה, s=הגדרות, Esc=סגירת דיאלוג.</p>
        <p className="mt-1">
          להתקנת האפליקציה במסך הבית: פתח באייפון ב-Safari, הקש על כפתור Share ובחר
          "Add to Home Screen".
        </p>
      </section>

      <style>{`
        .input {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-bg-elev);
          color: var(--color-text);
          font-size: 0.95rem;
        }
        .input:focus {
          outline: 2px solid #1e3a8a;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border"
      style={{
        background: active ? '#1e3a8a' : 'var(--color-bg-elev)',
        color: active ? '#fff' : 'var(--color-text)',
        borderColor: active ? '#1e3a8a' : 'var(--color-border)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
