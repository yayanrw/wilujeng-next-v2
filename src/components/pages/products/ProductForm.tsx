'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';

function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.18);
    });
  } catch { /* silently ignore if AudioContext unavailable */ }
}

function playFailSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* silently ignore if AudioContext unavailable */ }
}

import { Plus, Trash2, Dices, Camera, Info, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from '@/hooks/useToast';
import { useCatalogMetaStore } from '@/stores/catalogMetaStore';
import { useCatalogMeta } from '@/hooks/useCatalogMeta';

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
  averageCost: number;
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
  const [tierEnabled, setTierEnabled] = useState((initial?.tiers ?? []).length > 0);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const basePriceInputRef = useRef<HTMLInputElement>(null);
  const minStockInputRef = useRef<HTMLInputElement>(null);

  // Stok Awal refs
  const initialStockQtyRef = useRef<HTMLInputElement>(null);
  const initialStockBuyPriceRef = useRef<HTMLInputElement>(null);
  const initialStockSupplierRef = useRef<HTMLInputElement>(null);
  const initialStockExpiryRef = useRef<HTMLInputElement>(null);
  const initialStockNoteRef = useRef<HTMLTextAreaElement>(null);

  // BxGy refs
  const promoBuyQtyRef = useRef<HTMLInputElement>(null);
  const promoFreeQtyRef = useRef<HTMLInputElement>(null);
  const promoValidFromRef = useRef<HTMLInputElement>(null);
  const promoValidToRef = useRef<HTMLInputElement>(null);
  const promoMaxMultiplierRef = useRef<HTMLInputElement>(null);
  const tierAddButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const { showToast, Toast } = useToast();

  const checkSku = useCallback(async (skuValue: string): Promise<boolean> => {
    if (!skuValue.trim()) return false;
    const res = await fetch(`/api/products?exactSku=${encodeURIComponent(skuValue.trim())}`);
    if (!res.ok) return false;
    const data = (await res.json()) as Array<{ id: string; name: string }>;
    if (data.length > 0) {
      showToast(`${t.products.skuAlreadyExists} · ${data[0].name}`);
      setSku('');
      return true;
    }
    return false;
  }, [showToast, t]);

  const { categories, brands, suppliers } = useCatalogMeta();
  const addCategory = useCatalogMetaStore((s) => s.addCategory);
  const addBrand = useCatalogMetaStore((s) => s.addBrand);
  const addSupplier = useCatalogMetaStore((s) => s.addSupplier);

  // BxGy promo state
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promo, setPromo] = useState<BxgyPromo | null>(null);
  const [promoBuyQty, setPromoBuyQty] = useState(2);
  const [promoFreeQty, setPromoFreeQty] = useState(1);
  const [promoActive, setPromoActive] = useState(true);
  const [promoValidFrom, setPromoValidFrom] = useState('');
  const [promoValidTo, setPromoValidTo] = useState('');
  const [promoMaxMultiplier, setPromoMaxMultiplier] = useState('');
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Initial stock section (create mode only)
  const [initialStockEnabled, setInitialStockEnabled] = useState(false);
  const [initialStockQty, setInitialStockQty] = useState(1);
  const [initialStockBuyPrice, setInitialStockBuyPrice] = useState(0);
  const [initialStockSupplier, setInitialStockSupplier] = useState('');
  const [initialStockExpiry, setInitialStockExpiry] = useState('');
  const [initialStockNote, setInitialStockNote] = useState('');

  const fetchPromo = useCallback(async (productId: string) => {
    const res = await fetch(`/api/products/${productId}/promo`);
    if (!res.ok) return;
    const data = (await res.json()) as { promo: BxgyPromo | null };
    setPromo(data.promo);
    setPromoEnabled(!!data.promo);
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
      setTierEnabled((initial.tiers ?? []).length > 0);
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
      setTierEnabled(false);
      setPromo(null);
      setPromoEnabled(false);
      setInitialStockEnabled(false);
      setInitialStockQty(1);
      setInitialStockBuyPrice(0);
      setInitialStockSupplier('');
      setInitialStockExpiry('');
      setInitialStockNote('');
    }
    setSubmitted(false);
  }, [initial, mode, fetchPromo]);

  // Auto-focus first field when toggling sections open
  useEffect(() => {
    if (initialStockEnabled) setTimeout(() => initialStockQtyRef.current?.focus(), 0);
  }, [initialStockEnabled]);

  useEffect(() => {
    if (promoEnabled) setTimeout(() => promoBuyQtyRef.current?.focus(), 0);
  }, [promoEnabled]);

  useEffect(() => {
    if (tierEnabled) setTimeout(() => tierAddButtonRef.current?.focus(), 0);
  }, [tierEnabled]);

  const canSave = useMemo(
    () => sku.trim() && name.trim() && categoryName.trim() && brandName.trim(),
    [sku, name, categoryName, brandName],
  );

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
    <>
    <form
      ref={formRef}
      className="flex flex-col gap-3"
      onKeyDown={(e) => {
        if (e.shiftKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
        if (e.altKey && e.key === '1' && mode === 'create') {
          e.preventDefault();
          setInitialStockEnabled((v) => !v);
        }
        if (e.altKey && e.key === '2') {
          e.preventDefault();
          setTierEnabled((v) => !v);
        }
        if (e.altKey && e.key === '3') {
          e.preventDefault();
          setPromoEnabled((v) => !v);
        }
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!canSave) return;

        // Stok Awal section validation
        if (initialStockEnabled && initialStockQty < 1) return;
        if (initialStockEnabled && initialStockNote.length > 200) return;

        // BxGy promo section validation
        if (promoEnabled) {
          if (promoBuyQty < 1 || promoFreeQty < 1) return;
          const maxMulNum = promoMaxMultiplier !== '' ? Number(promoMaxMultiplier) : null;
          if (maxMulNum !== null && maxMulNum < 1) return;
          if (promoValidFrom && promoValidTo && new Date(promoValidTo) <= new Date(promoValidFrom)) return;
        }

        setPending(true);

        const payload: Record<string, unknown> = {
          sku: sku.trim(),
          name: name.trim(),
          basePrice,
          minStockThreshold,
          tiers: tierEnabled ? tiers.filter((t) => t.minQty > 0 && t.price > 0) : [],
          // buyPrice and stock are always 0 at creation; Stok Awal section triggers Stock In
          ...(mode === 'create' ? { buyPrice: 0, stock: 0 } : {}),
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
          id?: string;
          error?: { message?: string };
        } | null;
        setPending(false);
        if (!res.ok) {
          playFailSound();
          onSaved(false, body?.error?.message ?? 'Save failed');
          return;
        }

        // Keep local catalog in sync for newly typed category/brand
        if (cat) addCategory({ id: cat, name: cat });
        if (brand) addBrand({ id: brand, name: brand });

        // In create mode, add initial stock if enabled
        if (mode === 'create' && initialStockEnabled && initialStockQty > 0 && body?.id) {
          const stockRes = await fetch('/api/stock/in', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              productId: body.id,
              qty: initialStockQty,
              unitBuyPrice: initialStockBuyPrice,
              ...(initialStockSupplier.trim() ? { supplierName: initialStockSupplier.trim() } : {}),
              ...(initialStockExpiry ? { expiryDate: initialStockExpiry } : {}),
              ...(initialStockNote.trim() ? { note: initialStockNote.trim() } : {}),
            }),
          });
          if (!stockRes.ok) {
            playFailSound();
            onSaved(false, t.products.initialStockFailed);
            return;
          }
          if (initialStockSupplier.trim()) {
            addSupplier({ id: initialStockSupplier.trim(), name: initialStockSupplier.trim() });
          }
        }

        // In create mode, save promo alongside the new product if enabled
        if (mode === 'create' && promoEnabled && body?.id) {
          await fetch(`/api/products/${body.id}/promo`, {
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
          setTierEnabled(false);
          setPromoEnabled(false);
          setPromoBuyQty(2);
          setPromoFreeQty(1);
          setPromoActive(true);
          setPromoValidFrom('');
          setPromoValidTo('');
          setPromoMaxMultiplier('');
          setInitialStockEnabled(false);
          setInitialStockQty(1);
          setInitialStockBuyPrice(0);
          setInitialStockSupplier('');
          setInitialStockExpiry('');
          setInitialStockNote('');
          setSubmitted(false);
        }

        playSuccessSound();
        onSaved(true);
        skuInputRef.current?.focus();
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
    >
      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShortcutsOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={t.products.keyboardShortcuts}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {shortcutsOpen && (
            <div className="absolute right-0 top-8 z-50 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.products.keyboardShortcuts}
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
                  ['Enter', t.products.shortcutNextField],
                  ['⇧ Enter', t.products.shortcutSubmit],
                  ['⌥ 1', t.products.shortcutAlt1],
                  ['⌥ 2', t.products.shortcutAlt2],
                  ['⌥ 3', t.products.shortcutAlt3],
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
          {t.products.sku}
        </label>
        <div className="flex gap-2 mt-1.5">
          <Input
            ref={skuInputRef}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (mode === 'create') {
                  checkSku(sku).then((exists) => {
                    if (!exists) nameInputRef.current?.focus();
                  });
                } else {
                  nameInputRef.current?.focus();
                }
              }
            }}
            className="flex-1 font-mono text-sm"
            placeholder="Item SKU"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setScannerOpen(true)}
            title={t.pos.scanWithCamera}
            className="px-3"
            aria-label={t.pos.scanWithCamera}
          >
            <Camera className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
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
        {submitted && !sku.trim() && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.products.skuRequired}</p>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.products.name}
        </label>
        <Input
          ref={nameInputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              categoryInputRef.current?.focus();
            }
          }}
          className="mt-1.5 font-medium"
          placeholder={t.products.productName}
        />
        {submitted && !name.trim() && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.products.nameRequired}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <AutocompleteInput
            ref={categoryInputRef}
            label={t.products.category}
            value={categoryName}
            onChange={setCategoryName}
            options={categories}
            placeholder={t.products.typeToCreate}
            onNext={() => brandInputRef.current?.focus()}
            noMatchText={t.products.noMatches}
            createHintText={t.products.willCreateNew}
          />
          {submitted && !categoryName.trim() && (
            <p className="text-xs text-red-500 dark:text-red-400">{t.products.categoryRequired}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <AutocompleteInput
            ref={brandInputRef}
            label={t.products.brand}
            value={brandName}
            onChange={setBrandName}
            options={brands}
            placeholder={t.products.typeToCreate}
            onNext={() => basePriceInputRef.current?.focus()}
            noMatchText={t.products.noMatches}
            createHintText={t.products.willCreateNew}
          />
          {submitted && !brandName.trim() && (
            <p className="text-xs text-red-500 dark:text-red-400">{t.products.brandRequired}</p>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.products.basePrice}
        </label>
        <div className="relative mt-1.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
            Rp
          </span>
          <Input
            ref={basePriceInputRef}
            className="pl-9 font-medium tabular-nums"
            inputMode="numeric"
            value={basePrice ? String(basePrice) : ''}
            onChange={(e) =>
              setBasePrice(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                minStockInputRef.current?.focus();
              }
            }}
            placeholder="0"
          />
        </div>
      </div>

      {mode === 'edit' && (
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 truncate">
              {t.products.buyPrice}
            </div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300 truncate">
              Rp {(initial?.buyPrice ?? 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 truncate">
              {t.products.averageCost}
            </div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300 truncate">
              Rp {(initial?.averageCost ?? 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t.products.stock}
            </div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
              {initial?.stock ?? 0}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.products.minStock}
        </label>
        <Input
          ref={minStockInputRef}
          className="mt-1.5 font-medium tabular-nums"
          inputMode="numeric"
          value={String(minStockThreshold)}
          onChange={(e) =>
            setMinStockThreshold(
              Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
            )
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (mode === 'create' && initialStockEnabled) {
                initialStockQtyRef.current?.focus();
              }
            }
          }}
        />
      </div>

      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />

      {mode === 'create' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3"
            onClick={() => setInitialStockEnabled((v) => !v)}
          >
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t.products.initialStock}
                <kbd className="inline-flex items-center rounded border border-zinc-300 dark:border-zinc-600 px-1 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">⌥1</kbd>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.products.initialStockDesc}
              </div>
            </div>
            <span
              role="switch"
              aria-checked={initialStockEnabled}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                initialStockEnabled
                  ? 'bg-zinc-900 dark:bg-zinc-100'
                  : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  initialStockEnabled ? 'translate-x-4' : 'translate-x-0'
                } ${initialStockEnabled ? 'dark:bg-zinc-900' : ''}`}
              />
            </span>
          </button>

          {initialStockEnabled && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.stock.qty}
                  </label>
                  <Input
                    ref={initialStockQtyRef}
                    className="mt-1 h-8 text-sm tabular-nums"
                    inputMode="numeric"
                    value={initialStockQty > 0 ? String(initialStockQty) : ''}
                    placeholder="1"
                    onChange={(e) =>
                      setInitialStockQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); initialStockBuyPriceRef.current?.focus(); }
                    }}
                  />
                  {submitted && initialStockQty < 1 && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.stock.qtyMin1}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.products.buyPrice}
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">
                      Rp
                    </span>
                    <Input
                      ref={initialStockBuyPriceRef}
                      className="h-8 pl-8 text-sm tabular-nums"
                      inputMode="numeric"
                      value={initialStockBuyPrice ? String(initialStockBuyPrice) : ''}
                      onChange={(e) =>
                        setInitialStockBuyPrice(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                      }
                      placeholder="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); initialStockSupplierRef.current?.focus(); }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <AutocompleteInput
                  ref={initialStockSupplierRef}
                  label={t.stock.supplier}
                  value={initialStockSupplier}
                  onChange={setInitialStockSupplier}
                  options={suppliers}
                  placeholder={t.products.quickStockInSupplierPlaceholder}
                  noMatchText={t.products.noMatches}
                  createHintText={t.products.willCreateNew}
                  onNext={() => initialStockExpiryRef.current?.focus()}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.stock.expiryDate}
                </label>
                <Input
                  ref={initialStockExpiryRef}
                  type="date"
                  className="mt-1 h-8 text-sm"
                  value={initialStockExpiry}
                  onChange={(e) => setInitialStockExpiry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); initialStockNoteRef.current?.focus(); }
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.stock.notes}
                </label>
                <Textarea
                  ref={initialStockNoteRef}
                  className="mt-1 text-sm"
                  value={initialStockNote}
                  onChange={(e) => setInitialStockNote(e.target.value)}
                  placeholder="—"
                  rows={3}
                />
                <div className="flex justify-between mt-1">
                  {submitted && initialStockNote.length > 200 ? (
                    <p className="text-xs text-red-500 dark:text-red-400">{t.stock.noteTooLong}</p>
                  ) : <span />}
                  <span className={`text-[10px] tabular-nums ${initialStockNote.length > 200 ? 'text-red-500 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {initialStockNote.length}/200
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3"
          onClick={() => setTierEnabled((v) => !v)}
        >
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t.products.tierPricing}
              <kbd className="inline-flex items-center rounded border border-zinc-300 dark:border-zinc-600 px-1 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">⌥2</kbd>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.products.tierDesc}
            </div>
          </div>
          <span
            role="switch"
            aria-checked={tierEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
              tierEnabled
                ? 'bg-zinc-900 dark:bg-zinc-100'
                : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                tierEnabled ? 'translate-x-4' : 'translate-x-0'
              } ${tierEnabled ? 'dark:bg-zinc-900' : ''}`}
            />
          </span>
        </button>

        {tierEnabled && (
          <>
            <div className="flex justify-end">
              <Button
                ref={tierAddButtonRef}
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
          </>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3"
            onClick={() => setPromoEnabled((v) => !v)}
          >
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t.products.bxgyPromo}
                <kbd className="inline-flex items-center rounded border border-zinc-300 dark:border-zinc-600 px-1 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">⌥3</kbd>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyDesc}
              </div>
            </div>
            <span
              role="switch"
              aria-checked={promoEnabled}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                promoEnabled
                  ? 'bg-zinc-900 dark:bg-zinc-100'
                  : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  promoEnabled ? 'translate-x-4' : 'translate-x-0'
                } ${promoEnabled ? 'dark:bg-zinc-900' : ''}`}
              />
            </span>
          </button>

        {promoEnabled && (<>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyBuyQty}
              </label>
              <Input
                ref={promoBuyQtyRef}
                className="mt-1 h-8 text-sm tabular-nums"
                inputMode="numeric"
                value={String(promoBuyQty)}
                onChange={(e) =>
                  setPromoBuyQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); promoFreeQtyRef.current?.focus(); }
                }}
              />
              {submitted && promoBuyQty < 1 && (
                <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">{t.products.bxgyBuyQtyRequired}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyFreeQty}
              </label>
              <Input
                ref={promoFreeQtyRef}
                className="mt-1 h-8 text-sm tabular-nums"
                inputMode="numeric"
                value={String(promoFreeQty)}
                onChange={(e) =>
                  setPromoFreeQty(Number(e.target.value.replace(/[^0-9]/g, '')) || 1)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); promoValidFromRef.current?.focus(); }
                }}
              />
              {submitted && promoFreeQty < 1 && (
                <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">{t.products.bxgyFreeQtyRequired}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyValidFrom}
              </label>
              <Input
                ref={promoValidFromRef}
                type="datetime-local"
                className="mt-1 h-8 text-sm"
                value={promoValidFrom}
                onChange={(e) => setPromoValidFrom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); promoValidToRef.current?.focus(); }
                }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.products.bxgyValidTo}
              </label>
              <Input
                ref={promoValidToRef}
                type="datetime-local"
                className="mt-1 h-8 text-sm"
                value={promoValidTo}
                onChange={(e) => setPromoValidTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); promoMaxMultiplierRef.current?.focus(); }
                }}
              />
            </div>
          </div>
          {submitted && promoValidFrom && promoValidTo && new Date(promoValidTo) <= new Date(promoValidFrom) && (
            <p className="text-xs text-red-500 dark:text-red-400">{t.products.bxgyValidToAfterFrom}</p>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.products.bxgyMaxMultiplier}
            </label>
            <Input
              ref={promoMaxMultiplierRef}
              className="mt-1 h-8 text-sm tabular-nums"
              inputMode="numeric"
              placeholder="—"
              value={promoMaxMultiplier}
              onChange={(e) =>
                setPromoMaxMultiplier(e.target.value.replace(/[^0-9]/g, ''))
              }
            />
            {submitted && promoMaxMultiplier !== '' && Number(promoMaxMultiplier) < 1 && (
              <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">{t.products.bxgyMaxMultiplierMin}</p>
            )}
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

          {mode === 'edit' && (
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
                      setPromoEnabled(false);
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
          )}
        </>)}
      </div>

      <Button
        type="submit"
        disabled={pending || !canSave}
        className="mt-4 h-12 text-base font-semibold shadow-sm w-full"
      >
        {pending ? t.common.saving : t.products.saveProduct}
      </Button>

    </form>

    <BarcodeScannerModal
      open={scannerOpen}
      onScan={(code) => {
        setSku(code);
        setScannerOpen(false);
        if (mode === 'create') {
          checkSku(code).then((exists) => {
            if (!exists) nameInputRef.current?.focus();
          });
        }
      }}
      onClose={() => setScannerOpen(false)}
      scanIntervalMs={0}
    />

    <Toast />
    </>
  );
}
