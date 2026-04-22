import { useEffect, useState } from 'react';
import { Inbox, Send, Settings as SettingsIcon } from 'lucide-react';
import Feed from './components/Feed';
import Compose from './components/Compose';
import Settings from './components/Settings';
import { ToastProvider } from './components/ui/Toast';
import { useSettings } from './hooks/useSettings';

type Tab = 'feed' | 'compose' | 'settings';

export default function App() {
  const { settings } = useSettings();
  const [tab, setTab] = useState<Tab>('feed');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'c') setTab('compose');
      if (e.key === 'f') setTab('feed');
      if (e.key === 's') setTab('settings');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <header
          className="sticky top-0 z-30 border-b backdrop-blur"
          style={{
            background: 'color-mix(in srgb, var(--color-bg-elev) 85%, transparent)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-bold text-lg tracking-tight">ntfy · {settings.topic}</h1>
            <nav className="flex gap-1" role="tablist">
              <TabButton active={tab === 'feed'} onClick={() => setTab('feed')} icon={<Inbox size={18} />}>
                פיד
              </TabButton>
              <TabButton active={tab === 'compose'} onClick={() => setTab('compose')} icon={<Send size={18} />}>
                כתיבה
              </TabButton>
              <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<SettingsIcon size={18} />}>
                הגדרות
              </TabButton>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4">
          {tab === 'feed' && <Feed />}
          {tab === 'compose' && <Compose onSent={() => setTab('feed')} />}
          {tab === 'settings' && <Settings />}
        </main>

        <footer className="text-center text-xs py-3" style={{ color: 'var(--color-text-muted)' }}>
          קיצורי מקלדת: <kbd>f</kbd> פיד · <kbd>c</kbd> כתיבה · <kbd>s</kbd> הגדרות
        </footer>
      </div>
    </ToastProvider>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      style={{
        background: active ? 'var(--color-bg)' : 'transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        border: active ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      {icon}
      {children}
    </button>
  );
}
