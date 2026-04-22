import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  show: (kind: ToastKind, message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 inset-x-0 px-4 z-50 pointer-events-none flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            dir="auto"
            className="pointer-events-auto max-w-sm w-full rounded-lg px-4 py-2.5 shadow-lg text-sm font-medium"
            style={{
              background:
                t.kind === 'success'
                  ? '#059669'
                  : t.kind === 'error'
                    ? '#dc2626'
                    : '#2563eb',
              color: 'white',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function useToastNotifyOnline() {
  const { show } = useToast();
  useEffect(() => {
    const onOn = () => show('success', 'חוזר לרשת');
    const onOff = () => show('error', 'ללא חיבור לרשת');
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, [show]);
}
