"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UsePaginatedListOptions<T> {
  fetchFn: (params: { search: string; offset: number; limit: number }) => Promise<T[]>;
  limit?: number;
  debounceMs?: number;
}

interface UsePaginatedListReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  search: string;
  setSearch: (search: string) => void;
  loadMore: () => void;
  refresh: () => void;
}

export function usePaginatedList<T>({
  fetchFn,
  limit = 50,
  debounceMs = 500,
}: UsePaginatedListOptions<T>): UsePaginatedListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const doFetch = useCallback(
    async (searchValue: string, newOffset: number = 0) => {
      setLoading(true);
      try {
        const result = await fetchFn({
          search: searchValue,
          offset: newOffset,
          limit,
        });

        if (!isMountedRef.current) return;

        if (newOffset === 0) {
          setItems(result);
        } else {
          setItems((prev) => [...prev, ...result]);
        }

        setHasMore(result.length === limit);
        setOffset(newOffset + limit);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchFn, limit],
  );

  // Always up-to-date ref so effects don't need doFetch in their deps
  const doFetchRef = useRef(doFetch);
  doFetchRef.current = doFetch;

  // Search changes: debounced — does NOT clear existing items (avoids flicker while typing)
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      doFetchRef.current(search, 0);
    }, debounceMs);
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [search, debounceMs]);

  // fetchFn changes (filter changes): immediate, no debounce, clears stale items first.
  // Skip on initial mount — the search effect above handles the first load.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Return cleanup that resets the flag so React StrictMode double-invoke is handled correctly
      return () => { isFirstRender.current = true; };
    }
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setItems([]);
    doFetchRef.current(searchRef.current, 0);
  }, [doFetch]);

  const loadMore = useCallback(() => {
    doFetch(search, offset);
  }, [doFetch, search, offset]);

  const refresh = useCallback(() => {
    setOffset(0);
    doFetch(search, 0);
  }, [doFetch, search]);

  return {
    items,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    refresh,
  };
}
