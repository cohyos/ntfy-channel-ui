import { useCallback, useEffect, useState } from 'react';

export interface Settings {
  server: string;
  topic: string;
  theme: 'light' | 'dark';
  lastFrom: string;
  lastTo: string;
}

const DEFAULT_SETTINGS: Settings = {
  server: 'https://ntfy.sh',
  topic: 'dissertation_editor_ysf',
  theme: 'light',
  lastFrom: 'USER',
  lastTo: 'ORCH',
};

const STORAGE_KEY = 'ntfy-channel-ui:settings';

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota or privacy mode */
  }
}

let globalSettings = load();
const listeners = new Set<(s: Settings) => void>();

function broadcast(s: Settings) {
  globalSettings = s;
  save(s);
  listeners.forEach((l) => l(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(globalSettings);

  useEffect(() => {
    const l = (s: Settings) => setSettings(s);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    broadcast({ ...globalSettings, ...patch });
  }, []);

  const reset = useCallback(() => {
    broadcast(DEFAULT_SETTINGS);
  }, []);

  const importJson = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      broadcast({ ...DEFAULT_SETTINGS, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportJson = useCallback(() => JSON.stringify(globalSettings, null, 2), []);

  return { settings, update, reset, importJson, exportJson };
}
