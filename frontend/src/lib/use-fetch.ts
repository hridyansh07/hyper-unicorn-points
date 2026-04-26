import { useEffect, useRef, useState } from 'react';

interface Options {
  refetchInterval?: number;
}

interface Result<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

export function useFetch<T>(key: string, fn: () => Promise<T>, opts: Options = {}): Result<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  // Only the *first* fetch for a given key flips loading=true. Polled
  // refetches stay silent so consumers (FAB visibility, "loading…"
  // eyebrows) don't flicker every interval.
  const hasDataForKeyRef = useRef(false);

  useEffect(() => {
    hasDataForKeyRef.current = false;
    setData(null);
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    if (!hasDataForKeyRef.current) setLoading(true);
    fnRef.current()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        hasDataForKeyRef.current = true;
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, tick]);

  useEffect(() => {
    if (!opts.refetchInterval) return;
    const id = window.setInterval(() => setTick((t) => t + 1), opts.refetchInterval);
    return () => window.clearInterval(id);
  }, [key, opts.refetchInterval]);

  return { data, error, loading, refetch: () => setTick((t) => t + 1) };
}
