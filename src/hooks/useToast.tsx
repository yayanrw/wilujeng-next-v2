'use client';

import { useCallback, useState } from 'react';
import { Toast } from '@/components/pages/pos/Toast';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const ToastEl = () => <Toast message={message} />;

  return { showToast, Toast: ToastEl };
}
