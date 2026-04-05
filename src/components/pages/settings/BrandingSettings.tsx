'use client';

import { useEffect, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type Branding = {
  storeName: string;
  storeIconName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
};

const iconOptions = [
  'Store',
  'ShoppingBag',
  'Coffee',
  'Utensils',
  'Package',
  'Printer',
] as const;

export function BrandingSettings() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadBranding() {
    const res = await fetch('/api/settings');
    const body = (await res.json().catch(() => null)) as Branding | null;
    setBranding(body);
  }

  useEffect(() => {
    void loadBranding();
  }, []);

  const canSaveBranding = useMemo(
    () => (branding?.storeName?.trim() ?? '').length > 0,
    [branding],
  );

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold">Store branding</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Used in sidebar, login, and receipts
        </div>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="mb-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
            {message}
          </div>
        ) : null}

        {branding ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setMessage(null);
              const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(branding),
              });
              const body = (await res.json().catch(() => null)) as
                | { updated: true }
                | { error: { message: string } }
                | null;
              setPending(false);
              if (!res.ok) {
                setMessage(
                  body && 'error' in body
                    ? body.error.message
                    : 'Failed to save settings',
                );
                return;
              }
              setMessage('Saved');
              await loadBranding();
            }}
          >
            <div>
              <label className="text-sm font-medium">Store name</label>
              <Input
                value={branding.storeName}
                onChange={(e) =>
                  setBranding({ ...branding, storeName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {iconOptions.map((i) => {
                  const Icon =
                    (
                      LucideIcons as unknown as Record<
                        string,
                        React.ComponentType<{ className?: string }>
                      >
                    )[i] || LucideIcons.Store;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        i === branding.storeIconName
                          ? 'border-zinc-900 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-50'
                      }`}
                      onClick={() =>
                        setBranding({ ...branding, storeIconName: i })
                      }
                      title={i}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Selected:{' '}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {branding.storeIconName || 'None'}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={branding.storePhone}
                  onChange={(e) =>
                    setBranding({ ...branding, storePhone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={branding.storeAddress}
                  onChange={(e) =>
                    setBranding({ ...branding, storeAddress: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Receipt footer</label>
              <Input
                value={branding.receiptFooter}
                onChange={(e) =>
                  setBranding({ ...branding, receiptFooter: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={pending || !canSaveBranding}>
              {pending ? 'Saving...' : 'Save'}
            </Button>
          </form>
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
        )}
      </CardContent>
    </Card>
  );
}
