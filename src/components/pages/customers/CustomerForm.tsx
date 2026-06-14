'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { playFailSound, playSuccessSound } from '@/utils/sounds';
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
  const [totalDebt, setTotalDebt] = useState(initial?.totalDebt ?? 0);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const debtRef = useRef<HTMLInputElement>(null);
  const pointsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setPhone(initial.phone ?? '');
      setAddress(initial.address ?? '');
      setPoints(initial.points ?? 0);
      setTotalDebt(initial.totalDebt ?? 0);
    } else if (mode === 'create') {
      setName('');
      setPhone('');
      setAddress('');
      setPoints(0);
      setTotalDebt(0);
    }
    setSubmitted(false);
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
      ref={formRef}
      className={`flex flex-col gap-4 transition-opacity duration-150${pending ? ' opacity-60 pointer-events-none' : ''}`}
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

        const payload: Record<string, unknown> = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        };

        if (mode === 'edit') {
          payload.points = points;
        } else if (mode === 'create') {
          payload.totalDebt = totalDebt;
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
          playFailSound();
          onSaved(false, body?.error?.message ?? 'Save failed');
          return;
        }

        if (mode === 'create') {
          setName('');
          setPhone('');
          setAddress('');
          setPoints(0);
          setTotalDebt(0);
          setSubmitted(false);
        }

        playSuccessSound();
        onSaved(true);
        nameRef.current?.focus();
      }}
    >
      {/* Loading progress bar — always reserves h-1 space */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        style={{ opacity: pending ? 1 : 0 }}
      >
        <div className="h-full w-2/5 rounded-full bg-zinc-900 dark:bg-zinc-100 [animation:bar-slide_1.5s_ease-in-out_infinite]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.name}
          </label>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                phoneRef.current?.focus();
              }
            }}
            placeholder="John Doe"
            className="mt-1.5 font-medium"
          />
          {submitted && !name.trim() && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {t.customers.nameRequired}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.phone}
          </label>
          <Input
            ref={phoneRef}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addressRef.current?.focus();
              }
            }}
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
          ref={addressRef}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (mode === 'create') debtRef.current?.focus();
              else pointsRef.current?.focus();
            }
          }}
          placeholder="123 Main St"
          className="mt-1.5"
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.debt}
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 mt-0.5">
            {t.customers.initialDebtDesc}
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
              Rp
            </span>
            <Input
              ref={debtRef}
              className="pl-9 font-medium tabular-nums"
              inputMode="numeric"
              value={totalDebt ? String(totalDebt) : ''}
              onChange={(e) =>
                setTotalDebt(
                  Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                )
              }
              placeholder="0"
            />
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.customers.loyaltyPoints}
          </label>
          <div className="flex gap-2 mt-1.5">
            <Input
              ref={pointsRef}
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

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-1" />

      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
          className="w-full"
        >
          {t.common.cancel}
        </Button>
      )}

      <Button
        type="submit"
        disabled={pending || !canSave}
        className="h-12 text-base font-semibold shadow-sm w-full"
      >
        {pending
          ? t.common.saving
          : mode === 'create'
            ? t.customers.createCustomer
            : t.common.saveChanges}
      </Button>
    </form>
  );
}
