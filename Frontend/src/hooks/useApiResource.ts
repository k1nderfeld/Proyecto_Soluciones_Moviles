import { useCallback, useEffect, useRef, useState } from 'react';

interface ApiResourceState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export const useApiResource = <T,>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { enabled?: boolean } = {},
): ApiResourceState<T> => {
  const { enabled = true } = options;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);
  const requestId = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async (silent: boolean) => {
    const id = ++requestId.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) setData(result);
    } catch (caught) {
      if (id === requestId.current) setError(caught);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void run(false);
    return () => {
      requestId.current += 1;
    };
  }, [enabled, run, ...deps]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    await run(true);
  }, [enabled, run]);

  return { data, error, loading: enabled && loading, refreshing, reload, setData };
};
