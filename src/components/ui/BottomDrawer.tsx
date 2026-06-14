'use client';

import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { Button } from './Button';

export function BottomDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white dark:bg-zinc-950 shadow-2xl outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 pb-3">
            <div>
              <Drawer.Title className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </Drawer.Title>
              {subtitle && (
                <Drawer.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </Drawer.Description>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
