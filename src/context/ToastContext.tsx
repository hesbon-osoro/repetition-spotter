// src/context/ToastContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  persist?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, persist?: boolean) => string;
  updateToast: (id: string, message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', persist = false) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, message, type, persist }]);
      if (!persist) {
        setTimeout(() => removeToast(id), 3000);
      }
      return id;
    },
    [removeToast]
  );

  const updateToast = useCallback(
    (id: string, message: string, type?: ToastType) => {
      setToasts(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, message, type: type ?? t.type, persist: false }
            : t
        )
      );
      // Auto-remove updated toast after a short delay
      setTimeout(() => removeToast(id), 2500);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({ toasts, addToast, updateToast, removeToast }),
    [toasts, addToast, updateToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
