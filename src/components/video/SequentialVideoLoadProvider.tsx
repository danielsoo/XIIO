"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SequentialVideoContextValue = {
  activeKey: string | null;
  completedKeys: Set<string>;
  register: (key: string) => () => void;
  complete: (key: string) => void;
};

const SequentialVideoContext = createContext<SequentialVideoContextValue | null>(null);

export function SequentialVideoLoadProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    // Give eager thumbnail requests the network first, then start one video at a time.
    const timer = window.setTimeout(() => setStarted(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const register = useCallback((key: string) => {
    setQueue((prev) => (prev.includes(key) ? prev : [...prev, key]));
    return () => {
      setQueue((prev) => prev.filter((item) => item !== key));
      setCompletedKeys((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };
  }, []);

  const complete = useCallback((key: string) => {
    setCompletedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const activeKey = started ? queue.find((key) => !completedKeys.has(key)) ?? null : null;
  const value = useMemo(
    () => ({ activeKey, completedKeys, register, complete }),
    [activeKey, completedKeys, register, complete]
  );

  return <SequentialVideoContext.Provider value={value}>{children}</SequentialVideoContext.Provider>;
}

export function useSequentialVideoLoad(key: string, enabled: boolean) {
  const context = useContext(SequentialVideoContext);
  const register = context?.register;

  useEffect(() => {
    if (!register || !enabled) return;
    return register(key);
  }, [register, enabled, key]);

  return {
    shouldLoad:
      Boolean(context && enabled) &&
      (context!.activeKey === key || context!.completedKeys.has(key)),
    complete: () => context?.complete(key),
  };
}
