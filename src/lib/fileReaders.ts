import type { Attachment } from '../types/ntfy';

export type PreviewKind = 'text' | 'markdown' | 'json' | 'csv' | 'image' | 'pdf' | 'html' | 'download';

export interface Preview {
  kind: PreviewKind;
  content?: string;
  url: string;
  filename: string;
  mime: string;
}

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function looksLikeText(mime: string): boolean {
  if (!mime) return false;
  return (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript' ||
    mime === 'application/x-yaml'
  );
}

export async function loadPreview(a: Attachment, signal?: AbortSignal): Promise<Preview> {
  const mime = a.type ?? '';
  const ext = extOf(a.name);
  const base = { url: a.url, filename: a.name, mime };

  // Image types -> render inline
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
    return { ...base, kind: 'image' };
  }

  // PDF -> iframe
  if (mime === 'application/pdf' || ext === 'pdf') {
    return { ...base, kind: 'pdf' };
  }

  // DOCX -> use mammoth
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const res = await fetch(a.url, { signal });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buffer = await res.arrayBuffer();
    const mammoth = await import('mammoth/mammoth.browser');
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    return { ...base, kind: 'html', content: result.value };
  }

  // Markdown
  if (ext === 'md' || ext === 'markdown' || mime === 'text/markdown') {
    const text = await fetchText(a.url, signal);
    return { ...base, kind: 'markdown', content: text };
  }

  // JSON
  if (ext === 'json' || mime === 'application/json') {
    const text = await fetchText(a.url, signal);
    try {
      return { ...base, kind: 'json', content: JSON.stringify(JSON.parse(text), null, 2) };
    } catch {
      return { ...base, kind: 'text', content: text };
    }
  }

  // CSV / TSV
  if (ext === 'csv' || ext === 'tsv' || mime === 'text/csv') {
    const text = await fetchText(a.url, signal);
    return { ...base, kind: 'csv', content: text };
  }

  // Generic text
  if (looksLikeText(mime) || ['txt', 'log', 'xml', 'yml', 'yaml', 'ini', 'conf', 'sh', 'js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs'].includes(ext)) {
    const text = await fetchText(a.url, signal);
    return { ...base, kind: 'text', content: text };
  }

  return { ...base, kind: 'download' };
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.text();
}

/** Parses CSV/TSV text into 2D array. Handles quoted commas/newlines. */
export function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) {
        cur.push(field);
        field = '';
      } else if (c === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else if (c === '\r') {
        // ignore, \n will handle
      } else {
        field += c;
      }
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}
