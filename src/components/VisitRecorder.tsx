"use client";

import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useRecordVisit } from "@/hooks/useRecordVisit";

export default function VisitRecorder() {
  useRecordVisit();
  usePresenceHeartbeat();
  return null;
}
