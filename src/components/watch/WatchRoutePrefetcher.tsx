"use client";

import { useEffect } from "react";
import { prefetchPublicWatch } from "@/lib/watchDataCache";

function prefetchFromEvent(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLAnchorElement>('a[href^="/watch/"]');
  const href = anchor?.getAttribute("href");
  if (!href) return;
  const parts = href.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "watch") return;
  prefetchPublicWatch(parts[1]!, parts[2]!);
}

export default function WatchRoutePrefetcher() {
  useEffect(() => {
    document.addEventListener("pointerover", prefetchFromEvent, { passive: true });
    document.addEventListener("focusin", prefetchFromEvent);
    document.addEventListener("touchstart", prefetchFromEvent, { passive: true });
    return () => {
      document.removeEventListener("pointerover", prefetchFromEvent);
      document.removeEventListener("focusin", prefetchFromEvent);
      document.removeEventListener("touchstart", prefetchFromEvent);
    };
  }, []);

  return null;
}
