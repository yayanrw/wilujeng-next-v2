'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { playFailSound, playSuccessSound } from '@/utils/sounds';
import { useTranslation } from '@/i18n/useTranslation';

export type UserDto = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type Props = {
  mode: 'create' | 'edit';
  initial?: UserDto | null;
  onSaved: (success: boolean, errorMsg?: string) => void;
};

export function UserForm({ mode, initial, onSaved }: Props) {
  const { t } = useTranslation();

  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const canSave = useMemo(() => {
    if (mode === 'create') return Boolean(name.trim() && email.trim() && password.length >= 8);
    return true;
  }, [mode, name, email, password]);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setName(initial.name ?? '');
      setEmail(initial.email);
      setPassword('');
      setRole(initial.role as 'admin' | 'cashier');
    } else if (mode === 'create') {
      setName('');
      setEmail('');
      setPassword('');
      setRole('cashier');
    }
    setSubmitted(false);
  }, [initial, mode]);

  return (
    <form
      ref={formRef}
      className={`flex flex-col gap-3 transition-opacity duration-150${pending ? ' opacity-60 pointer-events-none' : ''}`}
      onKeyDown={(e) => {
        if (e.shiftKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!canSave) return;

        setPending(true);
        try {
          if (mode === 'create') {
            const res = await fetch('/api/users', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ name, email, password, role }),
            });
            const body = await res.json().catch(() => null) as { error?: { message: string } } | null;
            if (!res.ok) {
              playFailSound();
              onSaved(false, body?.error?.message ?? t.settings.saveFailed);
              return;
            }
            setName('');
            setEmail('');
            setPassword('');
            setRole('cashier');
            setSubmitted(false);
            playSuccessSound();
            onSaved(true);
            nameRef.current?.focus();
          } else if (initial) {
            const res = await fetch(`/api/users/${initial.id}`, {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ name, role }),
            });
            if (!res.ok) {
              playFailSound();
              onSaved(false, t.settings.saveFailed);
              return;
            }
            playSuccessSound();
            onSaved(true);
          }
        } finally {
          setPending(false);
        }
      }}
    >
      {/* Loading bar — always reserves h-1 space */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        style={{ opacity: pending ? 1 : 0 }}
      >
        <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Shortcuts popup */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShortcutsOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={t.settings.keyboardShortcuts}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {shortcutsOpen && (
            <div className="absolute right-0 top-8 z-50 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.settings.keyboardShortcuts}
                </span>
                <button
                  type="button"
                  onClick={() => setShortcutsOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-xs">
                {([
                  ['Enter', t.settings.shortcutNextField],
                  ['⇧ Enter', t.settings.shortcutSubmit],
                ] as [string, string][]).map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 truncate">{desc}</span>
                    <kbd className="shrink-0 inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.settings.name}
        </label>
        <Input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={mode === 'edit'}
          className="mt-1.5"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); emailRef.current?.focus(); }
          }}
        />
        {submitted && mode === 'create' && !name.trim() && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.settings.nameRequired}</p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.settings.email}
        </label>
        <Input
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mode === 'edit'}
          className="mt-1.5"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (mode === 'create') passwordRef.current?.focus();
            }
          }}
        />
        {submitted && mode === 'create' && !email.trim() && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.settings.emailRequired}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.settings.password}
          </label>
          <Input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); }
            }}
          />
          {submitted && password.length < 8 && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.settings.passwordMinLength}</p>
          )}
        </div>
      )}

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.settings.role}
        </label>
        <select
          className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value === 'admin' ? 'admin' : 'cashier')}
        >
          <option value="cashier">cashier</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <Button
        type="submit"
        disabled={pending || !canSave}
        className="mt-4 h-12 text-base font-semibold shadow-sm w-full"
      >
        {pending ? t.common.saving : mode === 'create' ? t.settings.createUser : t.common.saveChanges}
      </Button>
    </form>
  );
}
