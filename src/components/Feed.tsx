import { useMemo, useState } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import { useNtfyFeed } from '../hooks/useNtfyFeed';
import { useSettings } from '../hooks/useSettings';
import MessageCard from './MessageCard';
import FilterBar, { type FilterKind } from './FilterBar';
import type { NtfyMessage } from '../types/ntfy';

function matchFilter(msg: NtfyMessage, kind: FilterKind): boolean {
  if (kind === 'all') return true;
  const tags = msg.tags ?? [];
  if (kind === 'to-me') return tags.some((t) => t === 'to:user');
  if (kind === 'to-orch') return tags.some((t) => t === 'to:orch');
  if (kind === 'important') return (msg.priority ?? 3) >= 4;
  return true;
}

export default function Feed() {
  const { settings } = useSettings();
  const { messages, status, error, refresh } = useNtfyFeed(settings.server, settings.topic);
  const [filter, setFilter] = useState<FilterKind>('all');

  const counts = useMemo(() => {
    const base: Record<FilterKind, number> = {
      all: messages.length,
      'to-me': 0,
      'to-orch': 0,
      important: 0,
    };
    for (const m of messages) {
      if (matchFilter(m, 'to-me')) base['to-me']++;
      if (matchFilter(m, 'to-orch')) base['to-orch']++;
      if (matchFilter(m, 'important')) base.important++;
    }
    return base;
  }, [messages]);

  const visible = useMemo(
    () => messages.filter((m) => matchFilter(m, filter)),
    [messages, filter],
  );

  const statusLabel = {
    idle: '...',
    loading: 'טוען היסטוריה',
    live: 'מחובר',
    reconnecting: 'מתחבר מחדש',
    error: 'שגיאה',
  }[status];

  const statusDot = {
    idle: '#94a3b8',
    loading: '#f59e0b',
    live: '#10b981',
    reconnecting: '#f59e0b',
    error: '#dc2626',
  }[status];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: statusDot }}
            aria-hidden
          />
          <span style={{ color: 'var(--color-text-muted)' }}>{statusLabel}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>·</span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {messages.length} הודעות
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-700"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="רענן"
        >
          <RefreshCw size={14} /> רענון
        </button>
      </div>

      <FilterBar value={filter} onChange={setFilter} counts={counts} />

      {error ? (
        <div
          className="rounded-md p-3 text-sm"
          style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border-2 border-dashed"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <Inbox size={32} className="mx-auto mb-2 opacity-50" />
          <p>אין הודעות עדיין...</p>
          <p className="text-xs mt-1">
            {filter === 'all'
              ? 'ממתין להודעות חדשות בערוץ'
              : 'אין הודעות תואמות לסינון הנוכחי'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((m) => (
            <MessageCard key={m.id} msg={m} />
          ))}
        </div>
      )}
    </div>
  );
}
