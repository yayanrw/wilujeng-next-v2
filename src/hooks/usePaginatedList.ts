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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(
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

  // Handle search with debounce
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetch(search, 0);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [search, fetch, debounceMs]);

  const loadMore = useCallback(() => {
    fetch(search, offset);
  }, [fetch, search, offset]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetch(search, 0);
  }, [fetch, search]);

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
