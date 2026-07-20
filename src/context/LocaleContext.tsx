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
import { formatAdminTimestamp } from "@/lib/admin/format-timestamp";
import {
  dateLocaleForAppLocale,
  getStoredTimezone,
  resolveTimezoneIana,
  setStoredTimezone,
  type XiioTimezoneId,
} from "@/lib/timezone";
import { setStoredLocale, translate, type Locale } from "@/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  timezone: XiioTimezoneId;
  setTimezone: (timezone: XiioTimezoneId) => void;
  dateLocale: string;
  formatDateTime: (value: unknown) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [timezone, setTimezoneState] = useState<XiioTimezoneId>("korea");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState("en");
    setStoredLocale("en");
    setTimezoneState(getStoredTimezone());
    setReady(true);
  }, []);

  const setLocale = useCallback((_next: Locale) => {
    setLocaleState("en");
    setStoredLocale("en");
  }, []);

  const setTimezone = useCallback((next: XiioTimezoneId) => {
    setTimezoneState(next);
    setStoredTimezone(next);
  }, []);

  const dateLocale = dateLocaleForAppLocale(locale);
  const timeZoneIana = resolveTimezoneIana(timezone);

  const formatDateTime = useCallback(
    (value: unknown) =>
      formatAdminTimestamp(value, {
        locale: dateLocale,
        timeZone: timeZoneIana,
      }),
    [dateLocale, timeZoneIana]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      timezone,
      setTimezone,
      dateLocale,
      formatDateTime,
      t,
    }),
    [locale, setLocale, timezone, setTimezone, dateLocale, formatDateTime, t]
  );

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Shorthand: const { t } = useTranslations() */
export function useTranslations() {
  return useLocale();
}
