'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onClose,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-1 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800" style={{ opacity: loading ? 1 : 0 }}>
          <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
        </div>

        <div className="p-5 space-y-4">
          {description ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={onConfirm}
              disabled={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
