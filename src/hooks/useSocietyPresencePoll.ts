"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { User } from "firebase/auth";
import type { SocietyPerson } from "@/lib/societyTypes";

const POLL_MS = 60_000;

type PresenceEntry = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

type Props = {
  user: User | null;
  uids: string[];
  setPeople: Dispatch<SetStateAction<SocietyPerson[]>>;
  enabled: boolean;
};

async function fetchPresence(
  user: User,
  uids: string[]
): Promise<Record<string, PresenceEntry> | null> {
  if (uids.length === 0) return {};
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/discover/presence", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uids }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { presence?: Record<string, PresenceEntry> };
    return data.presence ?? {};
  } catch {
    return null;
  }
}

export function useSocietyPresencePoll({ user, uids, setPeople, enabled }: Props) {
  const uidsKey = uids.join(",");
  const uidsRef = useRef(uids);
  uidsRef.current = uids;

  useEffect(() => {
    if (!enabled || !user || uids.length === 0) return;

    let cancelled = false;

    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const currentUids = uidsRef.current;
      if (currentUids.length === 0) return;

      const presence = await fetchPresence(user, currentUids);
      if (cancelled || !presence) return;

      setPeople((prev) =>
        prev.map((person) => {
          const next = presence[person.uid];
          if (!next) return person;
          if (
            person.isOnline === next.isOnline &&
            person.lastSeenAt === next.lastSeenAt
          ) {
            return person;
          }
          return {
            ...person,
            isOnline: next.isOnline,
            lastSeenAt: next.lastSeenAt,
          };
        })
      );
    };

    void poll();
    const intervalId = setInterval(() => void poll(), POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, user, uidsKey, setPeople, uids.length]);
}
