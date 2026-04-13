'use client';

import { useEffect, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/i18n/useTranslation';

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
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

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
        <div className="text-sm font-semibold">{t.settings.storeBranding}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {t.settings.storeBrandingDesc}
        </div>
      </CardHeader>
      <CardContent>
        {branding ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
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
                showToast(
                  body && 'error' in body
                    ? body.error.message
                    : 'Failed to save settings',
                );
                return;
              }
              showToast(t.common.saved);
              await loadBranding();
            }}
          >
            <div>
              <label className="text-sm font-medium">
                {t.settings.storeName}
              </label>
              <Input
                value={branding.storeName}
                onChange={(e) =>
                  setBranding({ ...branding, storeName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {t.settings.storeIcon}
              </label>
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
                <label className="text-sm font-medium">
                  {t.settings.storePhone}
                </label>
                <Input
                  value={branding.storePhone}
                  onChange={(e) =>
                    setBranding({ ...branding, storePhone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t.settings.storeAddress}
                </label>
                <Input
                  value={branding.storeAddress}
                  onChange={(e) =>
                    setBranding({ ...branding, storeAddress: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                {t.settings.receiptFooter}
              </label>
              <Input
                value={branding.receiptFooter}
                onChange={(e) =>
                  setBranding({ ...branding, receiptFooter: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={pending || !canSaveBranding}>
              {pending ? t.common.saving : t.common.save}
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t.settings.loadingBranding}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <Toast />
    </Card>
  );
}
