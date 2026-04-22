const HEB_RE = /[֐-׿]/g;
const LETTER_RE = /[A-Za-z֐-׿]/g;

export function detectDir(text?: string | null): 'rtl' | 'ltr' | 'auto' {
  if (!text) return 'auto';
  const letters = text.match(LETTER_RE)?.length ?? 0;
  if (letters === 0) return 'auto';
  const heb = text.match(HEB_RE)?.length ?? 0;
  return heb / letters >= 0.3 ? 'rtl' : 'ltr';
}

export function looksLikeMarkdown(text?: string | null): boolean {
  if (!text) return false;
  return /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|```|\|.+\|)/.test(text) || /\*\*[^*]+\*\*/.test(text);
}

export function looksLikeJson(text?: string | null): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}
