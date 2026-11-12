import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListParams, Paginated } from '@/types/api';

interface PaginatedListOptions {
  limit?: number;
  filters?: Omit<ListParams, 'page' | 'limit'>;
  enabled?: boolean;
}

interface PaginatedListState<T> {
  items: T[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: unknown;
  hasMore: boolean;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const usePaginatedList = <T,>(
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  options: PaginatedListOptions = {},
): PaginatedListState<T> => {
  const { limit = 20, filters = {}, enabled = true } = options;
  const filterKey = JSON.stringify(filters);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append' | 'refresh') => {
      if (!enabled) return;
      const id = ++requestId.current;
      if (mode === 'append') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current({
          ...filtersRef.current,
          page: targetPage,
          limit,
        });
        if (id !== requestId.current) return;
        setItems((current) => {
          if (mode !== 'append') return result.items;
          const seen = new Set(current.map((item) => JSON.stringify(item)));
          return [...current, ...result.items.filter((item) => !seen.has(JSON.stringify(item)))];
        });
        setTotal(result.total);
        setPage(targetPage);
      } catch (caught) {
        if (id === requestId.current) setError(caught);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, limit],
  );

  useEffect(() => {
    void loadPage(1, 'replace');
    return () => {
      requestId.current += 1;
    };
  }, [enabled, filterKey, limit]);

  const reload = useCallback(async () => {
    await loadPage(1, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing) return;
    if (items.length >= total) return;
    await loadPage(page + 1, 'append');
  }, [items.length, loadPage, loading, loadingMore, page, refreshing, total]);

  return {
    items,
    total,
    loading: enabled && loading,
    loadingMore,
    refreshing,
    error,
    hasMore: items.length < total,
    reload,
    loadMore,
  };
};
