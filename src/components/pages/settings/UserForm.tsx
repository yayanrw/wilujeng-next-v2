'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
              : 'Failed to create user',
          );
          return;
        }

        showToast('User created successfully');
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
          showToast('Failed to update user');
          return;
        }

        showToast('User updated successfully');
        onSuccess();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={mode === 'edit'}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mode === 'edit'}
        />
      </div>
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === 'create'}
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Role</label>
        <select
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
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
              {pending ? 'Creating...' : 'Create User'}
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              {pending ? 'Saving...' : 'Save Changes'}
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
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
