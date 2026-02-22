'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastPayload = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

type ToastItem = ToastPayload & { id: string; type: ToastType };

type ToastContextValue = {
  notify: (toast: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((toast: ToastPayload) => {
    const id = crypto.randomUUID();
    const nextToast: ToastItem = {
      id,
      title: toast.title,
      message: toast.message,
      type: toast.type ?? 'info',
      duration: toast.duration ?? 4000,
    };

    setToasts((prev) => [...prev, nextToast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, nextToast.duration);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <div className="toast__title">{toast.title}</div>
            {toast.message ? <div className="toast__message">{toast.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
