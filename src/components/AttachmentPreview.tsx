import { useEffect, useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Attachment } from '../types/ntfy';
import { humanFileSize } from '../lib/format';
import { loadPreview, parseDelimited, type Preview } from '../lib/fileReaders';

interface Props {
  attachment: Attachment;
  onClose: () => void;
}

export default function AttachmentPreview({ attachment, onClose }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    loadPreview(attachment, ac.signal)
      .then((p) => {
        setPreview(p);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
        setLoading(false);
      });
    return () => ac.abort();
  }, [attachment]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl"
        style={{ background: 'var(--color-bg-elev)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between gap-3 p-3 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate" dir="auto">
              {attachment.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {humanFileSize(attachment.size)}
              {attachment.type ? ` · ${attachment.type}` : ''}
            </div>
          </div>
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            download={attachment.name}
            className="text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ExternalLink size={16} /> הורדה
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div
              className="flex items-center justify-center gap-2 py-12 text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Loader2 className="animate-spin" size={18} /> טוען תצוגה מקדימה…
            </div>
          ) : error ? (
            <div
              className="rounded-md p-3 text-sm"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              טעינת תצוגה מקדימה נכשלה: {error}
            </div>
          ) : preview ? (
            <PreviewBody preview={preview} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewBody({ preview }: { preview: Preview }) {
  switch (preview.kind) {
    case 'image':
      return (
        <div className="flex justify-center">
          <img
            src={preview.url}
            alt={preview.filename}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>
      );

    case 'pdf':
      return (
        <iframe
          src={preview.url}
          title={preview.filename}
          className="w-full"
          style={{ height: '70vh', border: '1px solid var(--color-border)', borderRadius: 8 }}
        />
      );

    case 'markdown':
      return (
        <div className="prose-rtl max-w-none" dir="auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview.content ?? ''}</ReactMarkdown>
        </div>
      );

    case 'json':
      return (
        <pre
          dir="ltr"
          className="text-sm whitespace-pre overflow-auto p-3 rounded"
          style={{
            background: 'color-mix(in srgb, currentColor 6%, transparent)',
          }}
        >
          <code>{preview.content}</code>
        </pre>
      );

    case 'csv':
      return <CsvPreview text={preview.content ?? ''} />;

    case 'html':
      return (
        <div
          className="prose-rtl max-w-none"
          dir="auto"
          dangerouslySetInnerHTML={{ __html: preview.content ?? '' }}
        />
      );

    case 'text':
      return (
        <pre
          dir="auto"
          className="text-sm whitespace-pre-wrap break-words p-3 rounded"
          style={{
            background: 'color-mix(in srgb, currentColor 6%, transparent)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {preview.content}
        </pre>
      );

    case 'download':
    default:
      return (
        <div className="text-center py-8">
          <p className="mb-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            אין תצוגה מקדימה לסוג הקובץ הזה.
          </p>
          <a
            href={preview.url}
            download={preview.filename}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e3a8a', color: '#fff' }}
          >
            הורד קובץ
          </a>
        </div>
      );
  }
}

function CsvPreview({ text }: { text: string }) {
  const isTsv = text.includes('\t') && !text.slice(0, 500).includes(',');
  const rows = parseDelimited(text, isTsv ? '\t' : ',').filter((r) => r.some((c) => c.length));
  if (rows.length === 0) return <div>קובץ ריק</div>;
  const [header, ...body] = rows;
  return (
    <div className="overflow-auto">
      <table className="border-collapse text-sm min-w-full">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th
                key={i}
                className="border px-2 py-1 text-start font-semibold"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'color-mix(in srgb, currentColor 5%, transparent)',
                }}
                dir="auto"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.slice(0, 500).map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className="border px-2 py-1"
                  style={{ borderColor: 'var(--color-border)' }}
                  dir="auto"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {body.length > 500 ? (
        <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          מוצגות 500 שורות ראשונות מתוך {body.length}.
        </div>
      ) : null}
    </div>
  );
}
