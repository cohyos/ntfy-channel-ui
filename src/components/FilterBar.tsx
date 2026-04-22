export type FilterKind = 'all' | 'to-me' | 'to-orch' | 'important';

interface Props {
  value: FilterKind;
  onChange: (v: FilterKind) => void;
  counts: Record<FilterKind, number>;
}

const LABELS: Record<FilterKind, string> = {
  all: 'הכל',
  'to-me': 'אליי',
  'to-orch': 'ל-ORCH',
  important: 'עדיפות גבוהה',
};

export default function FilterBar({ value, onChange, counts }: Props) {
  const items: FilterKind[] = ['all', 'to-me', 'to-orch', 'important'];
  return (
    <div
      className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1"
      role="tablist"
      aria-label="סינון הודעות"
    >
      {items.map((k) => {
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm border transition-colors"
            style={{
              background: active ? '#1e3a8a' : 'var(--color-bg-elev)',
              color: active ? '#fff' : 'var(--color-text)',
              borderColor: active ? '#1e3a8a' : 'var(--color-border)',
            }}
          >
            {LABELS[k]}
            <span className="ms-1.5 opacity-80 text-xs">({counts[k]})</span>
          </button>
        );
      })}
    </div>
  );
}
