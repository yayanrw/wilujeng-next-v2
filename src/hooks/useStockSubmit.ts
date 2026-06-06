'use client';

import { useCallback, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

export type StockSubmitFn = (
  path: string,
  payload: unknown,
) => Promise<boolean>;

type SubmitResult =
  | { prevStock: number; nextStock: number }
  | { error: { message: string } }
  | null;

/**
 * Owns the stock mutation lifecycle: POST request, pending flag, and
 * i18n toast feedback. Returns `true` when the request succeeds so callers
 * can reset their own form state.
 */
export function useStockSubmit(showToast: (message: string) => void) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const submit = useCallback<StockSubmitFn>(
    async (path, payload) => {
      setPending(true);
      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = (await res.json().catch(() => null)) as SubmitResult;

        if (!res.ok) {
          showToast(
            body && 'error' in body
              ? body.error.message
              : t.stock.requestFailed,
          );
          return false;
        }

        if (body && 'prevStock' in body) {
          showToast(
            `${t.stock.stockUpdated}: ${body.prevStock} → ${body.nextStock}`,
          );
        } else {
          showToast(t.common.saved);
        }
        return true;
      } catch {
        showToast(t.stock.errorOccurred);
        return false;
      } finally {
        setPending(false);
      }
    },
    [showToast, t],
  );

  return { submit, pending };
}
