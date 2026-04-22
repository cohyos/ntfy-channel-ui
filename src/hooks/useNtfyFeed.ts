import { useCallback, useEffect, useRef, useState } from 'react';
import { NtfyClient, mergeMessages } from '../lib/ntfy';
import type { NtfyMessage } from '../types/ntfy';

type Status = 'idle' | 'loading' | 'live' | 'reconnecting' | 'error';

export interface FeedState {
  messages: NtfyMessage[];
  status: Status;
  error: string | null;
  lastUpdate: number;
  refresh: () => void;
}

export function useNtfyFeed(server: string, topic: string, initialSince = '24h'): FeedState {
  const [messages, setMessages] = useState<NtfyMessage[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const messagesRef = useRef<NtfyMessage[]>([]);
  const lastSeenTimeRef = useRef<number>(0);

  messagesRef.current = messages;

  const refresh = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    const client = new NtfyClient({ server, topic });
    const abort = new AbortController();
    let cleanupStream: (() => void) | null = null;

    async function boot() {
      setStatus('loading');
      setError(null);
      try {
        const history = await client.fetchHistory(initialSince, abort.signal);
        const merged = mergeMessages(history, messagesRef.current);
        setMessages(merged);
        lastSeenTimeRef.current = Math.max(
          lastSeenTimeRef.current,
          ...history.map((m) => m.time),
          0,
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(`היסטוריה נכשלה: ${(err as Error).message}`);
      }

      cleanupStream = client.streamMessages(
        (msg) => {
          lastSeenTimeRef.current = Math.max(lastSeenTimeRef.current, msg.time);
          setMessages((prev) => mergeMessages([msg], prev));
          setStatus('live');
          setError(null);
        },
        {
          signal: abort.signal,
          onOpen: () => {
            setStatus('live');
            setError(null);
          },
          onError: () => {
            setStatus('reconnecting');
          },
        },
      );
    }

    void boot();

    // When tab returns to foreground, fetch any messages we missed.
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      if (lastSeenTimeRef.current === 0) return;
      try {
        const since = lastSeenTimeRef.current + 1;
        const gap = await client.fetchHistory(since, abort.signal);
        if (gap.length) {
          setMessages((prev) => mergeMessages(gap, prev));
          lastSeenTimeRef.current = Math.max(
            lastSeenTimeRef.current,
            ...gap.map((m) => m.time),
          );
        }
      } catch (_) {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      abort.abort();
      cleanupStream?.();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [server, topic, initialSince, lastUpdate]);

  return { messages, status, error, lastUpdate, refresh };
}
