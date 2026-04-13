'use client';

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
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 p-6 shadow-lg">
        {title ? (
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className={loading ? 'opacity-70' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
