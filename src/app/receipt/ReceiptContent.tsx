'use client';

import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

export function ReceiptContent({
  tx,
  items,
  branding,
}: {
  tx: any;
  items: any[];
  branding: any;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-center">
        <div className="text-base font-semibold">{branding.storeName}</div>
        {branding.storeAddress ? (
          <div className="text-xs">{branding.storeAddress}</div>
        ) : null}
        {branding.storePhone ? (
          <div className="text-xs">{branding.storePhone}</div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span>{t.customers.transaction}</span>
          <span className="font-mono">{tx.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t.customers.date}</span>
          <span>
            {new Date(tx.createdAt).toLocaleString(
              t.common.all === 'Semua' ? 'id-ID' : 'en-US',
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t.customers.status}</span>
          <span>{tx.status}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3">
        <div className="grid gap-2">
          {items.map((i, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate">{i.name ?? '(Unknown)'}</div>
                  <div className="text-zinc-600">
                    {i.qty} x {formatIdr(i.unitPrice)}
                  </div>
                </div>
                <div className="shrink-0 tabular-nums">
                  {formatIdr(i.subtotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Total</span>
          <span className="tabular-nums">{formatIdr(tx.totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t.customers.paid}</span>
          <span className="tabular-nums">{formatIdr(tx.amountReceived)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t.customers.change}</span>
          <span className="tabular-nums">{formatIdr(tx.change)}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-center text-xs text-zinc-600">
        {branding.receiptFooter}
      </div>
    </>
  );
}
