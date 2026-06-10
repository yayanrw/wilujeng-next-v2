'use client';

import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { usePosStore } from '@/stores/posStore';
import { useCatalogStore, type CatalogProduct } from '@/stores/catalogStore';
import { useCatalogMeta } from '@/hooks/useCatalogMeta';
import { useTranslation } from '@/i18n/useTranslation';

import { CategoryFilter } from './CategoryFilter';
import { ProductList } from './ProductList';
import { ProductSearchBar } from './ProductSearchBar';

export type ProductWithMeta = CatalogProduct & {
  stock: number;
  category: { id: string; name: string } | null;
};

export function ProductCatalog({
  inputRef,
  onToast,
  onCameraClick,
  onRequestCheckout,
  viewMode = 'grid',
  onViewModeChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onToast: (m: string) => void;
  onCameraClick?: () => void;
  onRequestCheckout?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const { t } = useTranslation();

  const products = useCatalogStore((s) => s.products);
  const stocks = useCatalogStore((s) => s.stocks);
  const loading = useCatalogStore((s) => s.loading);
  const addProduct = usePosStore((s) => s.addProduct);
  const { categories } = useCatalogMeta();

  const results = useMemo<ProductWithMeta[]>(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q);
        const matchesCategory =
          categoryId === 'all' || p.categoryId === categoryId;
        return matchesQuery && matchesCategory;
      })
      .map((p) => ({
        ...p,
        stock: stocks[p.id] ?? 0,
        category: categories.find((c) => c.id === p.categoryId) ?? null,
      }));
  }, [products, stocks, query, categoryId, categories]);

  function handleEnter(q: string) {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return;
    const match =
      results.find((r) => r.sku.toLowerCase() === trimmed) ?? results[0];
    if (!match) return;
    if (match.stock <= 0) {
      onToast(`${t.pos.cannotAdd} ${match.name}, ${t.pos.outOfStock}`);
      return;
    }
    addProduct(match, 1);
    onToast(`${match.name} ${t.pos.added}`);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleProductClick(p: ProductWithMeta) {
    if (p.stock <= 0) {
      onToast(`${t.pos.cannotAdd} ${p.name}, ${t.pos.outOfStock}`);
      return;
    }
    addProduct(p, 1);
    onToast(`${p.name} ${t.pos.added}`);
    inputRef.current?.focus();
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="shrink-0 space-y-4">
        <ProductSearchBar
          inputRef={inputRef}
          query={query}
          onQueryChange={setQuery}
          onEnter={handleEnter}
          onEmptyEnter={onRequestCheckout}
          onCameraClick={onCameraClick}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
        <CategoryFilter value={categoryId} onChange={setCategoryId} />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <ProductList
          results={results}
          viewMode={viewMode}
          loading={loading}
          categoryId={categoryId}
          highlightFirst={query.trim().length > 0}
          onProductClick={handleProductClick}
        />
      </CardContent>
    </Card>
  );
}
