import type { ParsedRouting } from '../types/ntfy';

// Matches: [ORCH->USER] ... | [USER → ORCH] ... | [AGENT-DANI => ORCH] ...
const ROUTE_RE = /^\s*\[\s*([A-Za-z0-9_\-]+)\s*(?:->|→|=>|>)\s*([A-Za-z0-9_\-]+)\s*\]\s*(.*)$/;

export function parseRouting(title?: string | null): ParsedRouting {
  if (!title) return { from: null, to: null, subject: '' };
  const m = title.match(ROUTE_RE);
  if (!m) return { from: null, to: null, subject: title };
  return { from: m[1].toUpperCase(), to: m[2].toUpperCase(), subject: m[3].trim() };
}

export function formatRouting(from: string, to: string, subject: string): string {
  return `[${from}->${to}] ${subject}`.trim();
}

export function routingTags(from: string, to: string): string[] {
  const tags: string[] = [];
  if (from) tags.push(`from:${from.toLowerCase()}`);
  if (to) tags.push(`to:${to.toLowerCase()}`);
  return tags;
}
