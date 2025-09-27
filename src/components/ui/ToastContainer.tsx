// src/components/ui/ToastContainer.tsx
import React from 'react';
import { useToast } from '@/context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed z-50 top-4 right-4 space-y-3 w-[320px] max-w-[90vw]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`shadow-lg border rounded-md px-4 py-3 text-sm backdrop-blur bg-white/90 flex items-start gap-3 ${
            t.type === 'success'
              ? 'border-green-300 text-green-800'
              : t.type === 'error'
                ? 'border-red-300 text-red-800'
                : 'border-blue-300 text-blue-800'
          }`}
        >
          <div className="flex-1 whitespace-pre-line">{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 text-gray-500 hover:text-gray-800"
            aria-label="Dismiss"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
