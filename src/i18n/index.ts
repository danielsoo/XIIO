import { messages, type Locale, type MessageTree } from "./messages";

export type { Locale, MessageTree };
export { messages, LOCALES } from "./messages";

const STORAGE_KEY = "xiio_locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "en" ? "en" : "ko";
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
}

function getByPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let node: unknown = tree;
  for (const part of parts) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const tree = messages[locale] as MessageTree;
  const value = getByPath(tree, key) ?? getByPath(messages.ko as MessageTree, key);
  if (!value) return key;
  return interpolate(value, vars);
}
