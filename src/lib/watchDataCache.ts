"use client";

import { readResponseJson } from "@/lib/clientErrors";
import { getCached, setCache } from "@/lib/feedCache";
import type { PublicWorkWatch } from "@/types/watch";

type WatchResponseBody = PublicWorkWatch & { message?: string; error?: string };

export type WatchRequestResult = {
  ok: boolean;
  status: number;
  data: WatchResponseBody;
  raw: string;
};

const inFlight = new Map<string, Promise<WatchRequestResult>>();
const WATCH_CACHE_TTL_MS = 5 * 60 * 1000;

function keyFor(ownerUid: string, workId: string) {
  return `watch:${ownerUid}:${workId}`;
}

export function requestPublicWatch(ownerUid: string, workId: string): Promise<WatchRequestResult> {
  const key = keyFor(ownerUid, workId);
  const cached = getCached<PublicWorkWatch>(key);
  if (cached) {
    return Promise.resolve({ ok: true, status: 200, data: cached, raw: "" });
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = fetch(`/api/watch/${ownerUid}/${workId}`)
    .then(async (response) => {
      const { data, raw } = await readResponseJson<WatchResponseBody>(response);
      if (response.ok) setCache(key, data, WATCH_CACHE_TTL_MS);
      return { ok: response.ok, status: response.status, data, raw };
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function prefetchPublicWatch(ownerUid: string, workId: string): void {
  void requestPublicWatch(ownerUid, workId).catch(() => undefined);
}
