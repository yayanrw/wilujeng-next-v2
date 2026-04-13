'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import { Plus, Trash2, Dices } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { AutocompleteInput } from './AutocompleteInput';
import { useTranslation } from '@/i18n/useTranslation';

type BxgyPromo = {
  id: string;
  buyQty: number;
  freeQty: number;
  active: boolean;
  validFrom: string | null;
  validTo: string | null;
  maxMultiplierPerTx: number | null;
};

export type ProductDto = {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  buyPrice: number;
  stock: number;
  minStockThreshold: number;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tiers: Array<{ minQty: number; price: number }>;
  isActive: boolean;
  isDeleted: boolean;
};

export function ProductForm({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: ProductDto;
  onSaved: (success: boolean, errorMsg?: string) => void;
}) {
  const missingEdit = mode === 'edit' && !initial;

  const [sku, setSku] = useState(initial?.sku ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? 0);
  const [buyPrice, setBuyPrice] = useState(initial?.buyPrice ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [minStockThreshold, setMinStockThreshold] = useState(
    initial?.minStockThreshold ?? 0,
  );
  const [categoryName, setCategoryName] = useState(
    initial?.category?.name ?? '',
  );
  const [brandName, setBrandName] = useState(initial?.brand?.name ?? '');
  const [tiers, setTiers] = useState<Array<{ minQty: number; price: number }>>(
    initial?.tiers ?? [],
  );
  const [pending, setPending] = useState(false);
  const { t } = useTranslation();

  // BxGy promo state
  const [promo, setPromo] = useState<BxgyPromo | null>(null);
  const [promoBuyQty, setPromoBuyQty] = useState(2);
  const [promoFreeQty, setPromoFreeQty] = useState(1);
  const [promoActive, setPromoActive] = useState(true);
  const [promoValidFrom, setPromoValidFrom] = useState('');
  const [promoValidTo, setPromoValidTo] = useState('');
  const [promoMaxMultiplier, setPromoMaxMultiplier] = useState('');
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchPromo = useCallback(async (productId: string) => {
    const res = await fetch(`/api/products/${productId}/promo`);
    if (!res.ok) return;
    const data = (await res.json()) as { promo: BxgyPromo | null };
    setPromo(data.promo);
    if (data.promo) {
      setPromoBuyQty(data.promo.buyQty);
      setPromoFreeQty(data.promo.freeQty);
      setPromoActive(data.promo.active);
      setPromoValidFrom(data.promo.validFrom ? data.promo.validFrom.slice(0, 16) : '');
      setPromoValidTo(data.promo.validTo ? data.promo.validTo.slice(0, 16) : '');
      setPromoMaxMultiplier(data.promo.maxMultiplierPerTx != null ? String(data.promo.maxMultiplierPerTx) : '');
    } else {
      setPromoBuyQty(2);
      setPromoFreeQty(1);
      setPromoActive(true);
      setPromoValidFrom('');
      setPromoValidTo('');
      setPromoMaxMultiplier('');
    }
  }, []);

  // Sync state when initial product changes (e.g. user clicks another product to edit)
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setSku(initial.sku);
      setName(initial.name);
      setBasePrice(initial.basePrice);
      setBuyPrice(initial.buyPrice);
      setStock(initial.stock);
      setMinStockThreshold(initial.minStockThreshold);
      setCategoryName(initial.category?.name ?? '');
      setBrandName(initial.brand?.name ?? '');
      setTiers(initial.tiers ?? []);
      fetchPromo(initial.id);
    } else if (mode === 'create') {
      setSku('');
      setName('');
      setBasePrice(0);
      setBuyPrice(0);
      setStock(0);
      setMinStockThreshold(0);
      setCategoryName('');
      setBrandName('');
      setTiers([]);
      setPromo(null);
    }
  }, [initial, mode, fetchPromo]);

  const canSave = useMemo(() => sku.trim() && name.trim(), [sku, name]);

  const generateSku = () => {
    // Generate a random 8-character alphanumeric SKU
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SKU-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSku(result);
  };

  if (missingEdit) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-sm text-zinc-500 dark:text-zinc-400">
        {t.products.selectToEdit}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setPending(true);

        const payload: Record<string, unknown> = {
          sku: sku.trim(),
          name: name.trim(),
          basePrice,
          buyPrice,
          stock,
          minStockThreshold,
          tiers: tiers.filter((t) => t.minQty > 0 && t.price > 0),
        };

        const cat = categoryName.trim();
        const brand = brandName.trim();
        if (mode === 'create') {
          if (cat) payload.categoryName = cat;
          if (brand) payload.brandName = brand;
        } else {
          if (!cat) payload.categoryId = null;
          if (!brand) payload.brandId = null;
          if (cat) payload.categoryName = cat;
          if (brand) payload.brandName = brand;
        }

        const res = await fetch(
          mode === 'create' ? '/api/products' : `/api/products/${initial!.id}`,
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
          setSku('');
          setName('');
          setBasePrice(0);
          setBuyPrice(0);
          setStock(0);
          setMinStockThreshold(0);
          setCategoryName('');
          setBrandName('');
          setTiers([]);
        }

        onSaved(true);
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.sku}
          </label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="Item SKU"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={generateSku}
              title={t.products.generateSku}
              className="px-3"
              aria-label={t.products.generateSku}
            >
              <Dices className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.name}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 font-medium"
            placeholder={t.products.productName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <AutocompleteInput
            label={t.products.category}
            value={categoryName}
            onChange={setCategoryName}
            fetchEndpoint="/api/categories"
            placeholder={t.products.typeToCreate}
          />
        </div>
        <div className="space-y-1.5">
          <AutocompleteInput
            label={t.products.brand}
            value={brandName}
            onChange={setBrandName}
            fetchEndpoint="/api/brands"
            placeholder={t.products.typeToCreate}
          />
        </div>
      </div>

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.buyPrice}
          </label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
              Rp
            </span>
            <Input
              className="pl-9 font-medium tabular-nums"
              inputMode="numeric"
              value={buyPrice ? String(buyPrice) : ''}
              onChange={(e) =>
                setBuyPrice(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
              }
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.basePrice}
          </label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
              Rp
            </span>
            <Input
              className="pl-9 font-medium tabular-nums"
              inputMode="numeric"
              value={basePrice ? String(basePrice) : ''}
              onChange={(e) =>
                setBasePrice(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.stock}
          </label>
          <Input
            className="mt-1.5 font-medium tabular-nums"
            inputMode="numeric"
            value={String(stock)}
            onChange={(e) =>
              setStock(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
            }
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t.products.minStock}
          </label>
          <Input
            className="mt-1.5 font-medium tabular-nums"
            inputMode="numeric"
            value={String(minStockThreshold)}
            onChange={(e) =>
              setMinStockThreshold(
                Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
              )
            }
          />
        </div>
      </div>

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t.products.tierPricing}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.products.tierDesc}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() =>
              setTiers((t) => [...t, { minQty: 1, price: basePrice }])
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            {t.products.addTier}
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {tiers.map((tItem, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.products.minQty}
                </label>
                <Input
                  className="mt-1 h-8 text-sm tabular-nums"
                  inputMode="numeric"
                  value={String(tItem.minQty)}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? {
                              ...x,
                              minQty:
                                Number(e.target.value.replace(/[^0-9]/g, '')) ||
                                0,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.products.tierPrice}
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">
                    Rp
                  </span>
                  <Input
                    className="h-8 pl-8 text-sm tabular-nums"
                    inputMode="numeric"
                    value={tItem.price ? String(tItem.price) : ''}
                    onChange={(e) =>
                      setTiers((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                price:
                                  Number(
                                    e.target.value.replace(/[^0-9]/g, ''),
                                  ) || 0,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 mt-[18px] shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-900 transition-colors"
                onClick={() =>
                  setTiers((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {tiers.length === 0 && (
            <div className="text-center py-4 text-sm text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              {t.products.noTier}
            </div>
          )}
        </div>
      </div>

      {mode === 'edit' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t.products.bxgyPromo}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.products.bxgyDesc}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyBuyQty}
              </label>
              <Input
                className="mt-1 h-8 text-sm tabular-nums"
                inputMode="numeric"
                value={String(promoBuyQty)}
                onChange={(e) =>
                  setPromoBuyQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyFreeQty}
              </label>
              <Input
                className="mt-1 h-8 text-sm tabular-nums"
                inputMode="numeric"
                value={String(promoFreeQty)}
                onChange={(e) =>
                  setPromoFreeQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyValidFrom}
              </label>
              <Input
                type="datetime-local"
                className="mt-1 h-8 text-sm"
                value={promoValidFrom}
                onChange={(e) => setPromoValidFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyValidTo}
              </label>
              <Input
                type="datetime-local"
                className="mt-1 h-8 text-sm"
                value={promoValidTo}
                onChange={(e) => setPromoValidTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.products.bxgyMaxMultiplier}
            </label>
            <Input
              className="mt-1 h-8 text-sm tabular-nums"
              inputMode="numeric"
              placeholder="—"
              value={promoMaxMultiplier}
              onChange={(e) =>
                setPromoMaxMultiplier(e.target.value.replace(/[^0-9]/g, ''))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="promoActive"
              type="checkbox"
              checked={promoActive}
              onChange={(e) => setPromoActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            <label
              htmlFor="promoActive"
              className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              {t.products.bxgyActive}
            </label>
          </div>

          {promoMsg && (
            <p
              className={`text-xs font-medium ${promoMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {promoMsg.text}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={promoSaving}
              onClick={async () => {
                setPromoSaving(true);
                setPromoMsg(null);
                const res = await fetch(`/api/products/${initial!.id}/promo`, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    buyQty: promoBuyQty,
                    freeQty: promoFreeQty,
                    active: promoActive,
                    validFrom: promoValidFrom ? new Date(promoValidFrom).toISOString() : null,
                    validTo: promoValidTo ? new Date(promoValidTo).toISOString() : null,
                    maxMultiplierPerTx: promoMaxMultiplier ? Number(promoMaxMultiplier) : null,
                  }),
                });
                setPromoSaving(false);
                if (res.ok) {
                  const data = (await res.json()) as { promo: BxgyPromo };
                  setPromo(data.promo);
                  setPromoMsg({ ok: true, text: t.products.bxgySavedSuccess });
                } else {
                  setPromoMsg({ ok: false, text: t.products.bxgySaveFailed });
                }
              }}
            >
              {t.products.bxgySave}
            </Button>

            {promo && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={promoSaving}
                onClick={async () => {
                  setPromoSaving(true);
                  setPromoMsg(null);
                  const res = await fetch(`/api/products/${initial!.id}/promo`, {
                    method: 'DELETE',
                  });
                  setPromoSaving(false);
                  if (res.ok) {
                    setPromo(null);
                    setPromoMsg({ ok: true, text: t.products.bxgyDeletedSuccess });
                  } else {
                    setPromoMsg({ ok: false, text: t.products.bxgyDeleteFailed });
                  }
                }}
              >
                {t.products.bxgyDelete}
              </Button>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || !canSave}
        className="mt-4 h-12 text-base font-semibold shadow-sm w-full"
      >
        {pending ? t.common.saving : t.products.saveProduct}
      </Button>
    </form>
  );
}
