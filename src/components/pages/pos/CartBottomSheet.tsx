'use client';

import { CartPanel } from './CartPanel';

export function CartBottomSheet({
  open,
  total,
  onCheckout,
  onClose,
}: {
  open: boolean;
  total: number;
  onCheckout: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-h-[85vh] flex flex-col rounded-t-2xl overflow-hidden bg-white dark:bg-zinc-950 animate-in slide-in-from-bottom duration-300 shadow-2xl">
        {/* Drag handle */}
        <div className="shrink-0 flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <CartPanel total={total} onCheckout={onCheckout} onClose={onClose} />
      </div>
    </div>
  );
}
