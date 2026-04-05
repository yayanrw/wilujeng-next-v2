'use client';

import { useMemo, useState, useEffect } from 'react';

import { Plus, Trash2, Dices } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { AutocompleteInput } from './AutocompleteInput';

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
    }
  }, [initial, mode]);

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
        Select a product to edit.
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">SKU</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={generateSku}
              title="Generate Random SKU"
              className="px-3"
              aria-label="Generate Random SKU"
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Base price</label>
          <Input
            value={String(basePrice)}
            onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Buy price</label>
          <Input
            value={String(buyPrice)}
            onChange={(e) => setBuyPrice(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Stock</label>
          <Input
            value={String(stock)}
            onChange={(e) => setStock(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Min stock threshold</label>
          <Input
            value={String(minStockThreshold)}
            onChange={(e) => setMinStockThreshold(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AutocompleteInput
          label="Category"
          value={categoryName}
          onChange={setCategoryName}
          fetchEndpoint="/api/categories"
          placeholder="Type to create"
        />
        <AutocompleteInput
          label="Brand"
          value={brandName}
          onChange={setBrandName}
          fetchEndpoint="/api/brands"
          placeholder="Type to create"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Tier pricing</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Best-match by highest min qty
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setTiers((t) => [...t, { minQty: 1, price: basePrice }])
            }
          >
            <Plus className="h-4 w-4" />
            Add tier
          </Button>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_40px] items-end gap-2"
            >
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Min qty</label>
                <Input
                  value={String(t.minQty)}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, minQty: Number(e.target.value) || 0 }
                          : x,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Price</label>
                <Input
                  value={String(t.price)}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, price: Number(e.target.value) || 0 }
                          : x,
                      ),
                    )
                  }
                />
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-100"
                onClick={() =>
                  setTiers((prev) => prev.filter((_, i) => i !== idx))
                }
                aria-label="Remove tier"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {!tiers.length ? (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No tiers. Base price will be used.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending || !canSave}>
          {pending ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
