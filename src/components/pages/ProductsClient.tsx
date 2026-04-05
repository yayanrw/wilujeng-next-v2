'use client';

import { useEffect, useMemo, useState } from 'react';

import { Plus, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatIdr } from '@/utils/money';

import { ProductForm, type ProductDto } from './products/ProductForm';
import { Toast } from './pos/Toast';

export function ProductsClient() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const LIMIT = 50;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selected = useMemo(
    () =>
      selectedId ? (products.find((p) => p.id === selectedId) ?? null) : null,
    [products, selectedId],
  );

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);

    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(console.error);
  }, []);

  async function fetchProducts(
    q: string,
    cat: string,
    brnd: string,
    p: number,
    append = false,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (cat && cat !== 'all') params.append('categoryId', cat);
      if (brnd && brnd !== 'all') params.append('brandId', brnd);
      params.append('limit', LIMIT.toString());
      params.append('offset', (p * LIMIT).toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const body = (await res.json().catch(() => [])) as ProductDto[];

      setHasMore(body.length === LIMIT);

      if (append) {
        setProducts((prev) => {
          // Filter out duplicates if any (shouldn't happen with strict offset, but good for safety)
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...body.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setProducts(body);
      }
    } catch (err) {
      console.error(err);
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setPage(0);
    await fetchProducts(search, categoryId, brandId, 0, false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(0);
    const t = window.setTimeout(
      () => void fetchProducts(search, categoryId, brandId, 0, false),
      500, // Increased debounce to 500ms
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, brandId]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(search, categoryId, brandId, nextPage, true);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Products</div>
              <div className="text-sm text-zinc-500">
                Create and edit products and tiers
              </div>
            </div>
            {/* The New button has been removed from here as requested */}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-3 sm:w-auto">
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      p.id === selectedId
                        ? 'border-b border-zinc-100 bg-zinc-50'
                        : 'border-b border-zinc-100 hover:bg-zinc-50'
                    }
                  >
                    <td className="py-2">
                      <button
                        type="button"
                        className="font-mono text-xs text-zinc-700 hover:text-zinc-900"
                        onClick={() => {
                          setSelectedId(p.id);
                          setMode('edit');
                        }}
                      >
                        {p.sku}
                      </button>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {p.minStockThreshold > 0 &&
                        p.stock <= p.minStockThreshold ? (
                          <Badge tone="warning">Low</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex gap-2 text-xs text-zinc-500">
                        {p.category ? <span>{p.category.name}</span> : null}
                        {p.brand ? <span>{p.brand.name}</span> : null}
                      </div>
                    </td>
                    <td className="py-2 tabular-nums">
                      {formatIdr(p.basePrice)}
                    </td>
                    <td className="py-2 tabular-nums">{p.stock}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-zinc-500 hover:text-zinc-900"
                        onClick={() => {
                          setSelectedId(p.id);
                          setMode('edit');
                        }}
                        title="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && products.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">Loading...</div>
          ) : null}
          {!loading && products.length === 0 && search ? (
            <div className="mt-3 text-sm text-zinc-500 text-center py-4">
              No products found.
            </div>
          ) : null}

          {hasMore && products.length > 0 && (
            <div className="mt-6 flex justify-center pb-2">
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Loading...' : 'Load More Products'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {mode === 'create' ? 'New product' : 'Edit product'}
              </div>
              <div className="text-xs text-zinc-500">Admin only</div>
            </div>
            {mode === 'edit' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMode('create');
                  setSelectedId(null);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode={mode}
            initial={mode === 'edit' ? (selected ?? undefined) : undefined}
            onSaved={async (success, errorMsg) => {
              if (success) {
                await refresh();
                if (mode === 'create') {
                  setMode('create');
                }
                showToast(
                  mode === 'create'
                    ? 'Product created successfully'
                    : 'Product updated successfully',
                );
              } else {
                showToast(errorMsg || 'Failed to save product');
              }
            }}
          />
        </CardContent>
      </Card>
      <Toast message={toastMessage} />
    </div>
  );
}
