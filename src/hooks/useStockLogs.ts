'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { StockLog } from '@/components/pages/stock/StockLogs';

const LIMIT = 50;

/**
 * Owns the stock-logs domain: list data, pagination, and date/product
 * filters. Fetches a fresh page when `enabled` becomes true (i.e. the Logs
 * tab is opened) and on explicit `applyFilter` / `loadMore` calls.
 */
export function useStockLogs(enabled: boolean) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [logs, setLogs] = useState<StockLog[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [filterProductId, setFilterProductId] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('limit', LIMIT.toString());
        params.append('offset', (targetPage * LIMIT).toString());
        if (dateFrom) params.append('from', dateFrom);
        if (dateTo) params.append('to', dateTo);
        if (filterProductId) params.append('productId', filterProductId);

        const res = await fetch(`/api/stock/logs?${params.toString()}`);
        const body = (await res.json().catch(() => [])) as StockLog[];

        setHasMore(body.length === LIMIT);
        setLogs((prev) => {
          if (!append) return body;
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...body.filter((item) => !seen.has(item.id))];
        });
      } catch (err) {
        console.error(err);
        if (!append) setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [dateFrom, dateTo, filterProductId],
  );

  // Keep the latest `load` reachable without making the auto-load effect
  // depend on filter values (which would reload on every keystroke).
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) return;
    setPage(0);
    void loadRef.current(0, false);
  }, [enabled]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void load(next, true);
  }, [loading, hasMore, page, load]);

  const applyFilter = useCallback(() => {
    setPage(0);
    void load(0, false);
  }, [load]);

  return {
    logs,
    loading,
    hasMore,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filterProductId,
    setFilterProductId,
    loadMore,
    applyFilter,
  };
}
