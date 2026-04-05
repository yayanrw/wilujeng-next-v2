'use client';

import { useEffect, useState, useCallback } from 'react';

import { Search, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePosStore, type PosProduct } from '@/stores/posStore';
import { formatIdr } from '@/utils/money';

type SearchResult = PosProduct & {
  category: { id: string; name: string } | null;
};

export function SearchPanel({
  inputRef,
  onToast,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onToast: (m: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const addProduct = usePosStore((s) => s.addProduct);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  const fetchProducts = useCallback(
    async (q: string, cat: string, p: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.append('query', q);
        if (cat && cat !== 'all') params.append('categoryId', cat);
        params.append('limit', LIMIT.toString());
        params.append('offset', (p * LIMIT).toString());

        const res = await fetch(`/api/pos/search?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: SearchResult[] = await res.json();

        setHasMore(data.length === LIMIT);

        if (append) {
          setResults((prev) => [...prev, ...data]);
        } else {
          setResults(data);
        }
      } catch (error) {
        console.error(error);
        if (!append) setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Effect to handle search/filter changes (resets to page 0)
  useEffect(() => {
    const q = query.trim();
    setPage(0);

    const timeoutId = setTimeout(() => {
      fetchProducts(q, categoryId, 0, false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, categoryId, fetchProducts]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(query.trim(), categoryId, nextPage, true);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="shrink-0 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <Input
            ref={inputRef}
            placeholder="Search name or scan SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const q = query.trim();
              if (!q) return;
              const exact = results.find((r) => r.sku === q);
              if (exact) {
                addProduct(exact, 1);
                onToast(`${exact.name} added`);
                setQuery('');
              }
            }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setCategoryId('all')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryId === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryId === cat.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              onClick={() => {
                addProduct(p, 1);
                onToast(`${p.name} added`);
                inputRef.current?.focus();
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge className="text-xs py-0 h-5 font-normal bg-zinc-100 text-zinc-800">
                    {p.sku}
                  </Badge>
                  {p.category && p.category.id !== categoryId ? (
                    <Badge
                      tone="neutral"
                      className="text-xs py-0 h-5 font-normal truncate max-w-[100px]"
                    >
                      {p.category.name}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="text-sm font-semibold tabular-nums">
                  {formatIdr(p.basePrice)}
                </div>
                <Badge
                  tone={
                    p.stock <= 0
                      ? 'danger'
                      : p.stock <= 5
                        ? 'warning'
                        : 'success'
                  }
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {p.stock} in stock
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-8 text-center text-sm text-zinc-500">
            Loading products...
          </div>
        )}

        {!loading && !results.length ? (
          <div className="py-12 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
            <Search className="h-8 w-8 text-zinc-300" />
            <p>No products found in this category.</p>
          </div>
        ) : null}

        {!loading && hasMore && results.length > 0 && (
          <div className="mt-4 flex justify-center pb-4">
            <Button
              variant="secondary"
              onClick={loadMore}
              className="w-full md:w-auto"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Load More Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
