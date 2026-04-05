'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

export type CustomerDto = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  points: number;
  totalDebt: number;
};

export function CustomerForm({
  mode,
  initial,
  onSaved,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: CustomerDto;
  onSaved: (success: boolean, errorMsg?: string) => void;
  onCancel?: () => void;
}) {
  const missingEdit = mode === 'edit' && !initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [pending, setPending] = useState(false);
  const { t } = useTranslation();

  // Sync state when initial customer changes
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setPhone(initial.phone ?? '');
      setAddress(initial.address ?? '');
      setPoints(initial.points ?? 0);
    } else if (mode === 'create') {
      setName('');
      setPhone('');
      setAddress('');
      setPoints(0);
    }
  }, [initial, mode]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  if (missingEdit) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-sm text-zinc-500 dark:text-zinc-400">
        {t.customers.selectToEdit}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setPending(true);

        const payload: Record<string, unknown> = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        };

        if (mode === 'edit') {
          payload.points = points;
        }

        const res = await fetch(
          mode === 'create'
            ? '/api/customers'
            : `/api/customers/${initial!.id}`,
          {
            method: mode === 'create' ? 'POST' : 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );

        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;

        setPending(false);

        if (!res.ok) {
          onSaved(false, body?.error?.message ?? 'Save failed');
          return;
        }

        if (mode === 'create') {
          setName('');
          setPhone('');
          setAddress('');
          setPoints(0);
        }

        onSaved(true);
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.name}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1.5 font-medium"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.phone}
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08123456789"
            className="mt-1.5 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.customers.address}
        </label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St"
          className="mt-1.5"
        />
      </div>

      {mode === 'edit' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.loyaltyPoints}
          </label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="number"
              min="0"
              value={String(points)}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className="flex-1 tabular-nums font-medium"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPoints(0)}
              title={t.customers.resetPoints}
              className="px-4"
            >
              {t.customers.reset}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {t.customers.adminCanReset}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={pending}
          >
            {t.common.cancel}
          </Button>
        )}
        <Button type="submit" disabled={pending || !canSave}>
          {pending
            ? t.common.saving
            : mode === 'create'
              ? t.customers.createCustomer
              : t.common.saveChanges}
        </Button>
      </div>
    </form>
  );
}
