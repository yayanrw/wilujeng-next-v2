'use client';

import { useState } from 'react';
import { Clock, AlertTriangle, X, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { usePosStore, type HeldCart } from '@/stores/posStore';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

const STALE_MS = 4 * 60 * 60 * 1000; // 4 hours

function timeElapsed(iso: string, t: ReturnType<typeof useTranslation>['t']): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t.pos.heldJustNow;
  if (mins < 60) return `${mins}${t.pos.heldMinutesAgo}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0
    ? `${hrs}h ${rem}${t.pos.heldMinutesAgo}`
    : `${hrs}${t.pos.heldHoursAgo}`;
}

function holdTotal(hold: HeldCart) {
  return hold.items.reduce((acc, i) => acc + i.subtotal, 0);
}

export function HeldCartsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const holds = usePosStore((s) => s.holds);
  const items = usePosStore((s) => s.items);
  const holdCurrentCart = usePosStore((s) => s.holdCurrentCart);
  const recallHold = usePosStore((s) => s.recallHold);
  const discardHold = usePosStore((s) => s.discardHold);

  // id of hold the user clicked Recall on — triggers conflict UI
  const [pendingRecallId, setPendingRecallId] = useState<string | null>(null);

  if (!open) return null;

  const hasActiveItems = items.length > 0;

  function handleRecall(id: string) {
    if (hasActiveItems) {
      setPendingRecallId(id);
      return;
    }
    recallHold(id);
    onClose();
  }

  function handleHoldCurrentAndRecall() {
    if (!pendingRecallId) return;
    holdCurrentCart();
    recallHold(pendingRecallId);
    setPendingRecallId(null);
    onClose();
  }

  function handleDiscardCurrentAndRecall() {
    if (!pendingRecallId) return;
    recallHold(pendingRecallId);
    setPendingRecallId(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { setPendingRecallId(null); onClose(); }}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t.pos.heldTransactions}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {holds.length} / 10
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setPendingRecallId(null); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conflict banner */}
        {pendingRecallId && (
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
              {t.pos.currentCartConflict}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleHoldCurrentAndRecall}
              >
                {t.pos.holdCurrentAndRecall}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleDiscardCurrentAndRecall}
              >
                {t.pos.discardCurrentAndRecall}
              </Button>
            </div>
          </div>
        )}

        {/* Hold list */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
          {holds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Clock className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.pos.noHeldCarts}
              </p>
            </div>
          ) : (
            holds.map((hold) => {
              const stale = Date.now() - new Date(hold.heldAt).getTime() > STALE_MS;
              const isConflicting = pendingRecallId === hold.id;
              return (
                <div
                  key={hold.id}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    isConflicting
                      ? 'bg-amber-50/50 dark:bg-amber-900/10'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {hold.customerName ?? t.pos.walkInCustomer}
                      </span>
                      {stale && (
                        <span title={t.pos.staleHold}>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {hold.items.length} {hold.items.length === 1 ? t.pos.item : t.pos.items}
                        {' · '}
                        {formatIdr(holdTotal(hold))}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {timeElapsed(hold.heldAt, t)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRecall(hold.id)}
                      className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t.pos.recallCart}
                    </button>
                    <button
                      type="button"
                      onClick={() => { discardHold(hold.id); setPendingRecallId(null); }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title={t.pos.discardHold}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
