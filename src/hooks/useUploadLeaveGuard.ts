"use client";

import { useEffect } from "react";

/** Warn before tab close / refresh while upload or submit is in progress. */
export function useUploadLeaveGuard(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}
