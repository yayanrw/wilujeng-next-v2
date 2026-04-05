'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginForm({ hasUsers }: { hasUsers?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = useMemo(() => sp.get('redirectTo') ?? '/', [sp]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 flex w-full flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);

        const { error: signInError } = await authClient.signIn.email(
          { email, password, callbackURL: redirectTo, rememberMe: true },
          {
            onError: (ctx) => {
              setError(ctx.error.message);
            },
          },
        );

        setPending(false);
        if (signInError) return;
        router.push(redirectTo);
        router.refresh();
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Email
        </label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>
      {!hasUsers && (
        <button
          type="button"
          className="text-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          onClick={() => router.push('/setup')}
        >
          First time setup
        </button>
      )}
    </form>
  );
}
