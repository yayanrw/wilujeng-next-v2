'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from "@/i18n/useTranslation";

export function ReceiptClient() {
  const { t } = useTranslation();

  useEffect(() => {
    const t = window.setTimeout(() => {
      window.print();
    }, 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden mt-4 flex justify-center">
      <Button variant="secondary" onClick={() => window.print()}>
        {t.pos.printReceipt}
      </Button>
    </div>
  );
}
