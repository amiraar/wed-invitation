'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toast from '@/components/ui/Toast';

type Variant = 'success' | 'error';
type ShowToast = (message: string, variant?: Variant) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

// One place for save/delete feedback on every admin page, always visible at the bottom.
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; variant: Variant } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((message, variant = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, variant });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 lg:justify-end lg:px-6"
      >
        {toast && (
          <div className="pointer-events-auto max-w-md shadow-lg" style={{ background: 'var(--adm-bg-topbar)', borderRadius: '1rem' }}>
            <Toast message={toast.message} variant={toast.variant} />
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
