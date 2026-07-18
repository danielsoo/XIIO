"use client";

import { useEffect, useRef, useState } from "react";
import { IconDotsVertical, IconReply, IconSmilePlus } from "@/components/icons/MockupIcons";
import { useTranslations } from "@/context/LocaleContext";
import { MESSAGE_REACTION_EMOJIS } from "@/lib/dm/messageReactions";

type Props = {
  active: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  /** Only pass this for messages the current user sent — shows "delete" in the more menu. */
  onDelete?: () => void;
};

export default function MessageActionsToolbar({ active, onReact, onReply, onCopy, onDelete }: Props) {
  const { t } = useTranslations();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
        setMoreMenuOpen(false);
      }
    };
    if (emojiPickerOpen || moreMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [emojiPickerOpen, moreMenuOpen]);

  return (
    <div ref={wrapperRef} className="relative shrink-0 self-center">
      <div
        className={`flex items-center gap-0.5 transition-opacity ${
          active || emojiPickerOpen || moreMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setEmojiPickerOpen((v) => !v);
            setMoreMenuOpen(false);
          }}
          className="inline-flex items-center justify-center p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label={t("dm.actions.react")}
        >
          <IconSmilePlus className="w-[19px] h-[19px]" />
        </button>
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center justify-center p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label={t("dm.actions.reply")}
        >
          <IconReply className="w-[19px] h-[19px]" />
        </button>
        <button
          type="button"
          onClick={() => {
            setMoreMenuOpen((v) => !v);
            setEmojiPickerOpen(false);
          }}
          className="inline-flex items-center justify-center p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label={t("dm.actions.more")}
        >
          <IconDotsVertical className="w-[19px] h-[19px]" />
        </button>
      </div>

      {emojiPickerOpen && (
        <div className="animate-dropdown-in absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-[#1c1c1e] border border-white/10 rounded-full shadow-lg px-2 py-1.5 z-10">
          {MESSAGE_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                setEmojiPickerOpen(false);
              }}
              className="text-lg leading-none p-0.5 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {moreMenuOpen && (
        <div className="animate-dropdown-in absolute bottom-full left-0 mb-2 min-w-[130px] bg-[#1c1c1e] border border-white/10 rounded-lg shadow-lg py-1 z-10">
          <button
            type="button"
            onClick={() => {
              onCopy();
              setMoreMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition"
          >
            {t("dm.actions.copy")}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                setMoreMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition"
            >
              {t("dm.actions.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
