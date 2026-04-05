'use client';

import { useState } from 'react';

import { BrandingSettings } from '@/components/pages/settings/BrandingSettings';
import { UsersSettings } from '@/components/pages/settings/UsersSettings';
import { AppearanceSettings } from '@/components/pages/settings/AppearanceSettings';
import { useTranslation } from '@/i18n/useTranslation';

export function SettingsClient() {
  const [tab, setTab] = useState<'branding' | 'users' | 'appearance'>(
    'branding',
  );
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {t.nav.settings}
      </div>

      <div className="flex gap-2">
        {(['branding', 'users', 'appearance'] as const).map((tTab) => (
          <button
            key={tTab}
            type="button"
            className={
              tTab === tab
                ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
            }
            onClick={() => setTab(tTab)}
          >
            {t.common[tTab]}
          </button>
        ))}
      </div>

      {tab === 'branding' && <BrandingSettings />}
      {tab === 'users' && <UsersSettings />}
      {tab === 'appearance' && <AppearanceSettings />}
    </div>
  );
}
