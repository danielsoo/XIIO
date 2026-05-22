"use client";

import { useEffect, useState } from "react";
import PromoShortPeekPreview from "@/components/shorts/PromoShortPeekPreview";
import type { PromoShort } from "@/types/promoShort";

function circularDistance(i: number, center: number, count: number): number {
  if (count <= 1) return 0;
  const d = Math.abs(i - center);
  return Math.min(d, count - d);
}

function peekPreloadForIndex(
  i: number,
  center: number,
  count: number,
  idleWarm: boolean
): "auto" | "metadata" | "none" {
  if (count <= 1) return "metadata";
  const d = circularDistance(i, center, count);
  if (d <= 1) return "metadata";
  if (idleWarm) return "metadata";
  return "none";
}

type Props = {
  items: PromoShort[];
  activeIndex: number;
  /** 이 풀에서 보여 줄 항목 id (prev 또는 next) */
  visibleId: string;
};

/** 좌·우 피크 — 항목별 video DOM 유지, visible만 전환해 리로드 깜빡임 방지 */
export default function PromoShortPeekPool({ items, activeIndex, visibleId }: Props) {
  const count = items.length;
  const [idleWarmIds, setIdleWarmIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (count <= 3) return;

    const warmRest = () => {
      const next = new Set<string>();
      items.forEach((item, i) => {
        if (circularDistance(i, activeIndex, count) > 1) {
          next.add(item.id);
        }
      });
      setIdleWarmIds(next);
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(warmRest, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(warmRest, 400);
    return () => window.clearTimeout(t);
  }, [items, activeIndex, count]);

  return (
    <div className="relative h-full w-full">
      {items.map((item, i) => {
        const isVisible = item.id === visibleId;
        const idleWarm = idleWarmIds.has(item.id);
        const preload = peekPreloadForIndex(i, activeIndex, count, idleWarm);

        return (
          <div
            key={item.id}
            className={`absolute inset-0 ${
              isVisible ? "z-10" : "z-0 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isVisible}
          >
            <PromoShortPeekPreview item={item} visible={isVisible} preload={preload} />
          </div>
        );
      })}
    </div>
  );
}
