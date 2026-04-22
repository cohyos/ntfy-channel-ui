import { X, ExternalLink } from 'lucide-react';
import type { Attachment } from '../types/ntfy';
import { humanFileSize } from '../lib/format';

interface Props {
  attachment: Attachment;
  onClose: () => void;
}

export default function AttachmentPreview({ attachment, onClose }: Props) {
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
              {humanFileSize(attachment.size)} · {attachment.type ?? 'unknown'}
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

        <div className="flex-1 overflow-auto p-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          תצוגה מקדימה תתווסף ב-Phase 5. לעת עתה — הורד באמצעות הכפתור למעלה.
        </div>
      </div>
    </div>
  );
}
