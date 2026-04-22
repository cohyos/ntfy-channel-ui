import type { NtfyMessage, PublishOptions, Priority } from '../types/ntfy';

export interface NtfyClientConfig {
  server: string;
  topic: string;
}

/**
 * HTTP header values must be ASCII. For non-ASCII (Hebrew etc.) use RFC 2047
 * encoded-word form. Browsers accept this in fetch() headers.
 */
export function encodeHeaderValue(v: string): string {
  if (/^[\x20-\x7E]*$/.test(v)) return v;
  // btoa requires latin1; encode UTF-8 bytes as latin1 first
  const utf8 = new TextEncoder().encode(v);
  let binary = '';
  utf8.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const b64 = btoa(binary);
  return `=?UTF-8?B?${b64}?=`;
}

export class NtfyClient {
  server: string;
  topic: string;

  constructor(config: NtfyClientConfig) {
    this.server = config.server.replace(/\/$/, '');
    this.topic = config.topic;
  }

  private topicUrl(): string {
    return `${this.server}/${encodeURIComponent(this.topic)}`;
  }

  /**
   * Opens an SSE connection with exponential-backoff auto-reconnect.
   * Returns a cleanup function.
   */
  streamMessages(
    onMessage: (msg: NtfyMessage) => void,
    opts?: {
      onError?: (e: Event) => void;
      onOpen?: () => void;
      signal?: AbortSignal;
    },
  ): () => void {
    let es: EventSource | null = null;
    let retryDelay = 1000;
    let stopped = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (stopped) return;
      try {
        es = new EventSource(`${this.topicUrl()}/sse`);
      } catch (err) {
        opts?.onError?.(new Event('error'));
        scheduleReconnect();
        return;
      }

      es.onopen = () => {
        retryDelay = 1000;
        opts?.onOpen?.();
      };

      es.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data) as NtfyMessage;
          if (msg.event === 'message') onMessage(msg);
        } catch (err) {
          console.warn('[ntfy] SSE parse error', err);
        }
      };

      es.onerror = (e: Event) => {
        opts?.onError?.(e);
        es?.close();
        es = null;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      reconnectTimer = window.setTimeout(() => {
        connect();
        retryDelay = Math.min(retryDelay * 2, 30000);
      }, retryDelay);
    };

    connect();

    const abort = () => {
      stopped = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      es?.close();
      es = null;
    };

    opts?.signal?.addEventListener('abort', abort, { once: true });

    return abort;
  }

  /**
   * Fetches historical messages (NDJSON via poll=1).
   * `since` may be '10m', '1h', '24h', a unix timestamp number, or 'all'.
   */
  async fetchHistory(since: string | number = '24h', signal?: AbortSignal): Promise<NtfyMessage[]> {
    const url = new URL(`${this.topicUrl()}/json`);
    url.searchParams.set('poll', '1');
    url.searchParams.set('since', String(since));

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`history ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as NtfyMessage;
        } catch {
          return null;
        }
      })
      .filter((m): m is NtfyMessage => m !== null && m.event === 'message');
  }

  async publishText(body: string, opts: PublishOptions = {}, signal?: AbortSignal): Promise<NtfyMessage> {
    const headers = this.buildHeaders(opts);
    const res = await fetch(this.topicUrl(), {
      method: 'POST',
      headers,
      body,
      signal,
    });
    if (!res.ok) {
      throw new Error(`publish ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as NtfyMessage;
  }

  /**
   * JSON-body fallback for when header-encoding is not supported by a client
   * or when title/message contains non-ASCII characters we want to guarantee
   * travel intact.
   */
  async publishJson(opts: PublishOptions & { message: string }, signal?: AbortSignal): Promise<NtfyMessage> {
    const payload: Record<string, unknown> = {
      topic: this.topic,
      message: opts.message,
    };
    if (opts.title) payload.title = opts.title;
    if (opts.tags?.length) payload.tags = opts.tags;
    if (opts.priority) payload.priority = opts.priority;
    const res = await fetch(this.server, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) {
      throw new Error(`publishJson ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as NtfyMessage;
  }

  async publishFile(file: File, opts: PublishOptions = {}, signal?: AbortSignal): Promise<NtfyMessage> {
    const filename = opts.filename ?? file.name;
    const headers = this.buildHeaders(opts, {
      Filename: encodeHeaderValue(filename),
      'Content-Type': file.type || 'application/octet-stream',
    });
    const res = await fetch(this.topicUrl(), {
      method: 'PUT',
      headers,
      body: file,
      signal,
    });
    if (!res.ok) {
      throw new Error(`upload ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as NtfyMessage;
  }

  async fetchAttachment(url: string, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`attachment ${res.status}`);
    return res;
  }

  private buildHeaders(
    opts: PublishOptions,
    extra: Record<string, string> = {},
  ): HeadersInit {
    const h: Record<string, string> = {};
    if (opts.title) h['Title'] = encodeHeaderValue(opts.title);
    if (opts.message) h['Message'] = encodeHeaderValue(opts.message);
    if (opts.tags?.length) h['Tags'] = opts.tags.join(',');
    if (opts.priority) h['Priority'] = String(opts.priority satisfies Priority);
    Object.assign(h, extra);
    return h;
  }
}

/** Convenience: dedupe messages by id, preserving newest-first order. */
export function mergeMessages(...lists: NtfyMessage[][]): NtfyMessage[] {
  const map = new Map<string, NtfyMessage>();
  for (const list of lists) {
    for (const m of list) {
      if (!m.id) continue;
      map.set(m.id, m);
    }
  }
  return [...map.values()].sort((a, b) => b.time - a.time);
}
