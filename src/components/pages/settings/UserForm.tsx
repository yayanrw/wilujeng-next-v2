'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  onSuccess: () => void;
  showToast: (msg: string) => void;
  onCancelEdit?: () => void;
};

export function UserForm({
  mode,
  initial,
  onSuccess,
  showToast,
  onCancelEdit,
}: Props) {
  const [pending, setPending] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const { t } = useTranslation();

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setName(initial.name ?? '');
      setEmail(initial.email);
      setPassword(''); // Don't show password for edit
      setRole(initial.role as 'admin' | 'cashier');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('cashier');
    }
  }, [mode, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      if (mode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        });

        const body = (await res.json().catch(() => null)) as
          | { id: string }
          | { error: { message: string } }
          | null;

        if (!res.ok) {
          showToast(
            body && 'error' in body
              ? body.error.message
              : t.settings.saveFailed,
          );
          return;
        }

        showToast(t.settings.createdSuccess);
        setName('');
        setEmail('');
        setPassword('');
        setRole('cashier');
        onSuccess();
      } else if (mode === 'edit' && initial) {
        // TODO: Update user's name as well in API if needed
        const res = await fetch(`/api/users/${initial.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            role,
          }),
        });

        if (!res.ok) {
          showToast(t.settings.saveFailed);
          return;
        }

        showToast(t.settings.updatedSuccess);
        onSuccess();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium">{t.settings.name}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={mode === 'edit'}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t.settings.email}</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mode === 'edit'}
        />
      </div>
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium">{t.settings.password}</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === 'create'}
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">{t.settings.role}</label>
        <select
          className="h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-sm"
          value={role}
          onChange={(e) =>
            setRole(e.target.value === 'admin' ? 'admin' : 'cashier')
          }
        >
          <option value="cashier">cashier</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={
            pending ||
            (mode === 'create' && (!email.trim() || password.length < 8))
          }
          className="flex-1"
        >
          {mode === 'create' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {pending ? t.common.saving : t.settings.createUser}
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              {pending ? t.common.saving : t.common.saveChanges}
            </>
          )}
        </Button>
        {mode === 'edit' && onCancelEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelEdit}
            disabled={pending}
          >
            {t.common.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
