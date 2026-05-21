"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useTagSuggestions } from "@/hooks/useTagSuggestions";
import {
  displayTag,
  MAX_TAGS,
  normalizeTagQueryInput,
  normalizeTags,
  stripTagHash,
} from "@/lib/works/label-utils";
import type { User } from "firebase/auth";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  /** When set, uses this user for suggest API instead of useAuth (e.g. parent already has user). */
  user?: User | null;
};

export default function WorkTagInput({
  value,
  onChange,
  disabled = false,
  className = "",
  inputClassName = "",
  user: userProp,
}: Props) {
  const { user: authUser } = useAuth();
  const user = userProp ?? authUser;
  const { t } = useTranslations();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const compositionEndAtRef = useRef(0);
  const [query, setQuery] = useState("#");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const ENTER_DEBOUNCE_MS = 50;

  const isImeComposing = (e: React.KeyboardEvent<HTMLInputElement>) =>
    e.nativeEvent.isComposing || composingRef.current || e.keyCode === 229;

  const shouldIgnoreEnterAfterComposition = () =>
    Date.now() - compositionEndAtRef.current < ENTER_DEBOUNCE_MS;

  const needle = stripTagHash(query);
  const { items: suggestions } = useTagSuggestions(user, query, open && !disabled && needle.length >= 1);

  const filteredSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  const addTag = useCallback(
    (raw: string) => {
      const label = stripTagHash(raw);
      if (!label) return;
      const next = normalizeTags([...value, label]);
      if (next.length === value.length) return;
      onChange(next);
      setQuery("#");
      setHighlight(0);
      setOpen(false);
    },
    [value, onChange]
  );

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFocus = () => {
    if (query === "") setQuery("#");
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(normalizeTagQueryInput(e.target.value));
    setOpen(true);
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Backspace" && (query === "#" || query === "")) {
      if (value.length > 0) {
        e.preventDefault();
        removeTag(value.length - 1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setOpen(true);
        setHighlight((h) => (h + 1) % filteredSuggestions.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setOpen(true);
        setHighlight((h) => (h - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
      return;
    }

    if (e.key === "Enter") {
      if (isImeComposing(e) || shouldIgnoreEnterAfterComposition()) {
        return;
      }
      e.preventDefault();
      if (value.length >= MAX_TAGS) return;
      if (open && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[highlight] ?? filteredSuggestions[0]);
      } else if (needle.length > 0) {
        addTag(needle);
      }
    }
  };

  const atMax = value.length >= MAX_TAGS;

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
            compositionEndAtRef.current = Date.now();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || atMax}
          placeholder={t("uploader.tagSearchPlaceholder")}
          aria-autocomplete="list"
          aria-controls={open && filteredSuggestions.length > 0 ? listId : undefined}
          aria-expanded={open && filteredSuggestions.length > 0}
          className={inputClassName}
        />
        {open && filteredSuggestions.length > 0 && !atMax && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/15 bg-xiio-surface shadow-xl py-1"
          >
            {filteredSuggestions.map((tag, i) => (
              <li key={tag} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    i === highlight
                      ? "bg-xiio-accent/20 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(tag)}
                  onMouseEnter={() => setHighlight(i)}
                >
                  {displayTag(tag)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {atMax && (
        <p className="mt-1.5 text-xs text-amber-400/90">{t("uploader.tagMaxReached", { max: MAX_TAGS })}</p>
      )}
      {!atMax && needle.length > 0 && (
        <p className="mt-1.5 text-xs text-xiio-muted">{t("uploader.tagAddHint")}</p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-xiio-accent/15 border border-xiio-accent/35 px-3 py-1 text-sm text-white"
            >
              <span>{displayTag(tag)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-white/70 hover:text-white leading-none p-0.5"
                  aria-label={t("uploader.tagRemove", { tag: displayTag(tag) })}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
