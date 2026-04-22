import { useCallback, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, X, AlertTriangle } from 'lucide-react';
import { NtfyClient } from '../lib/ntfy';
import { formatRouting, routingTags } from '../lib/parseRouting';
import { detectDir } from '../lib/bidi';
import { humanFileSize } from '../lib/format';
import { useSettings } from '../hooks/useSettings';
import { useToast } from './ui/Toast';
import type { Priority } from '../types/ntfy';

interface Props {
  onSent?: () => void;
}

const PRESETS = ['USER', 'ORCH', 'AGENT', 'AGENT-DANI', 'AGENT-RACHEL'];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function Compose({ onSent }: Props) {
  const { settings, update } = useSettings();
  const { show } = useToast();

  const [from, setFrom] = useState(settings.lastFrom);
  const [to, setTo] = useState(settings.lastTo);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [tagsInput, setTagsInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extraTags = useMemo(
    () =>
      tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const effectiveTags = useMemo(
    () => [...routingTags(from, to), ...extraTags],
    [from, to, extraTags],
  );

  const pickFile = (f: File | null) => {
    setFile(f);
    if (f && f.size > MAX_FILE_SIZE) {
      show('error', `הקובץ חורג מ-${humanFileSize(MAX_FILE_SIZE)} (מגבלת ntfy.sh)`);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const reset = () => {
    setSubject('');
    setMessage('');
    setTagsInput('');
    setFile(null);
    setPriority(3);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async () => {
    if (!from.trim() || !to.trim()) {
      show('error', 'יש לבחור FROM ו-TO');
      return;
    }
    if (!file && !message.trim() && !subject.trim()) {
      show('error', 'הוסף הודעה, כותרת או קובץ');
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      show('error', 'הקובץ גדול מדי');
      return;
    }

    const title = subject.trim() ? formatRouting(from, to, subject.trim()) : formatRouting(from, to, '');

    setSending(true);
    try {
      const client = new NtfyClient({ server: settings.server, topic: settings.topic });
      if (file) {
        await client.publishFile(file, {
          title,
          tags: effectiveTags,
          priority,
          message: message.trim() || undefined,
        });
        show('success', 'הקובץ נשלח');
      } else {
        await client.publishText(message, {
          title,
          tags: effectiveTags,
          priority,
        });
        show('success', 'ההודעה נשלחה');
      }
      update({ lastFrom: from, lastTo: to });
      reset();
      onSent?.();
    } catch (err) {
      const msg = (err as Error).message;
      show('error', `שליחה נכשלה: ${msg}`);
      // Try JSON-body fallback for text-only sends if headers seem problematic.
      if (!file && /40\d|encoding/i.test(msg)) {
        try {
          const client = new NtfyClient({ server: settings.server, topic: settings.topic });
          await client.publishJson({
            title,
            tags: effectiveTags,
            priority,
            message: message || subject,
          });
          show('success', 'נשלח דרך JSON fallback');
          update({ lastFrom: from, lastTo: to });
          reset();
          onSent?.();
        } catch (e2) {
          show('error', `גם JSON fallback נכשל: ${(e2 as Error).message}`);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const previewTitle = formatRouting(from || '?', to || '?', subject || '…');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <PresetSelect label="שולח (FROM)" value={from} onChange={setFrom} />
        <PresetSelect label="אל (TO)" value={to} onChange={setTo} />
      </div>

      <Field label="נושא">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="למשל: Plan v2 ready"
          dir={detectDir(subject)}
          className="input"
        />
      </Field>

      <div
        className="text-xs font-mono px-2 py-1 rounded"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text-muted)',
          border: '1px dashed var(--color-border)',
        }}
        dir="ltr"
      >
        {previewTitle}
      </div>

      <Field label="הודעה">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="תוכן ההודעה..."
          dir={detectDir(message)}
          className="input min-h-[8rem] resize-y"
        />
      </Field>

      <Field label="Tags נוספים (comma-separated)">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="status:done, stage:7"
          dir="ltr"
          className="input"
        />
      </Field>

      {effectiveTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 -mt-2">
          {effectiveTags.map((t) => (
            <span
              key={t}
              dir="ltr"
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      ) : null}

      <Field label="עדיפות">
        <div className="flex gap-1" role="radiogroup">
          {([1, 2, 3, 4, 5] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={priority === p}
              onClick={() => setPriority(p)}
              className="flex-1 py-2 rounded-md border text-sm"
              style={{
                background: priority === p ? '#1e3a8a' : 'var(--color-bg-elev)',
                color: priority === p ? '#fff' : 'var(--color-text)',
                borderColor: priority === p ? '#1e3a8a' : 'var(--color-border)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <div
        className="rounded-xl border-2 p-4 transition-colors"
        style={{
          borderColor: dragOver ? '#1e3a8a' : 'var(--color-border)',
          background: dragOver ? 'color-mix(in srgb, #1e3a8a 8%, transparent)' : 'transparent',
          borderStyle: 'dashed',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Paperclip size={18} className="shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium" dir="auto">
                  {file.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {humanFileSize(file.size)} · {file.type || 'unknown'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="הסר קובץ"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              גרור קובץ או בחר ידנית (עד 15MB)
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Paperclip size={16} /> צרף קובץ
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file && file.size > MAX_FILE_SIZE ? (
          <div
            className="mt-2 flex items-center gap-1.5 text-xs"
            style={{ color: '#dc2626' }}
          >
            <AlertTriangle size={14} /> חורג מ-15MB — ntfy.sh ידחה
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full inline-flex justify-center items-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        style={{ background: '#1e3a8a', color: '#fff' }}
      >
        <Send size={18} />
        {sending ? 'שולח...' : file ? 'שלח עם קובץ' : 'שלח'}
      </button>

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
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
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

function PresetSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isPreset = PRESETS.includes(value);
  const [mode, setMode] = useState<'preset' | 'custom'>(isPreset ? 'preset' : 'custom');
  return (
    <label className="block">
      <span
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <div className="flex gap-1">
        {mode === 'preset' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input flex-1"
            dir="ltr"
          >
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="input flex-1"
            dir="ltr"
            placeholder="CUSTOM"
          />
        )}
        <button
          type="button"
          onClick={() => setMode(mode === 'preset' ? 'custom' : 'preset')}
          className="text-xs px-2 rounded border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {mode === 'preset' ? 'אחר' : 'רשימה'}
        </button>
      </div>
    </label>
  );
}
