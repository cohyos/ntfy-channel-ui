import { useState } from 'react';
import { Paperclip, ArrowLeftRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NtfyMessage } from '../types/ntfy';
import { parseRouting } from '../lib/parseRouting';
import { detectDir, looksLikeMarkdown } from '../lib/bidi';
import { relativeTime, humanFileSize } from '../lib/format';
import AttachmentPreview from './AttachmentPreview';

interface Props {
  msg: NtfyMessage;
}

function priorityColor(p?: number): string {
  if (p === 5) return '#dc2626';
  if (p === 4) return '#ea580c';
  if (p === 2) return '#64748b';
  if (p === 1) return '#94a3b8';
  return '#2563eb';
}

function priorityLabel(p?: number): string {
  if (p === 5) return 'קריטי';
  if (p === 4) return 'חשוב';
  if (p === 3) return 'רגיל';
  if (p === 2) return 'נמוך';
  if (p === 1) return 'מינימלי';
  return 'רגיל';
}

export default function MessageCard({ msg }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const routing = parseRouting(msg.title);
  const isMarkdown =
    msg.tags?.some((t) => t === 'md' || t === 'markdown') ?? looksLikeMarkdown(msg.message);
  const dir = detectDir(msg.message);
  const pColor = priorityColor(msg.priority);

  return (
    <article
      className="rounded-xl border p-3 sm:p-4 shadow-sm"
      style={{
        background: 'var(--color-bg-elev)',
        borderColor: 'var(--color-border)',
        borderInlineStartWidth: '4px',
        borderInlineStartColor: pColor,
      }}
    >
      <header className="flex flex-wrap items-start gap-2 mb-2">
        {routing.from && routing.to ? (
          <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">
            <strong>{routing.from}</strong>
            <ArrowLeftRight size={12} className="opacity-60" />
            <strong>{routing.to}</strong>
          </span>
        ) : null}
        <h3
          className="font-semibold text-base flex-1 min-w-0 break-words"
          dir={detectDir(routing.subject)}
        >
          {routing.subject || '(ללא כותרת)'}
        </h3>
        <time
          className="text-xs shrink-0 font-mono"
          style={{ color: 'var(--color-text-muted)' }}
          title={new Date(msg.time * 1000).toLocaleString('he-IL')}
          dir="ltr"
        >
          {relativeTime(msg.time)}
        </time>
      </header>

      {msg.message ? (
        <div dir={dir} className="mt-1.5">
          {isMarkdown ? (
            <div className="prose-rtl text-[0.95rem]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">
              {msg.message}
            </p>
          )}
        </div>
      ) : null}

      {msg.attachment ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Paperclip size={16} />
            <span dir="auto" className="max-w-[14rem] truncate">
              {msg.attachment.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {humanFileSize(msg.attachment.size)}
            </span>
          </button>
        </div>
      ) : null}

      <footer
        className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${pColor}22`, color: pColor }}>
          P{msg.priority ?? 3} · {priorityLabel(msg.priority)}
        </span>
        {msg.tags?.filter((t) => !t.startsWith('from:') && !t.startsWith('to:')).map((t) => (
          <span
            key={t}
            className="inline-flex items-center px-2 py-0.5 rounded-full border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            #{t}
          </span>
        ))}
      </footer>

      {msg.attachment && previewOpen ? (
        <AttachmentPreview
          attachment={msg.attachment}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </article>
  );
}
