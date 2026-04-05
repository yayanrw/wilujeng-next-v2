'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useEffect, useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useTranslation } from '@/i18n/useTranslation';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useUiStore();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t.settings.theme}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.settings.themeDesc}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                theme === 'light'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Sun className="h-6 w-6" />
              <span className="text-sm font-medium">{t.settings.light}</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                theme === 'dark'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">{t.settings.dark}</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                theme === 'system'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm font-medium">{t.settings.system}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t.settings.language}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.settings.languageDesc}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                language === 'en'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Languages className="h-6 w-6" />
              <span className="text-sm font-medium">English</span>
            </button>

            <button
              onClick={() => setLanguage('id')}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                language === 'id'
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Languages className="h-6 w-6" />
              <span className="text-sm font-medium">Bahasa Indonesia</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
