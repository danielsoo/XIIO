"use client";

import { useRecordVisit } from "@/hooks/useRecordVisit";

export default function VisitRecorder() {
  useRecordVisit();
  return null;
}
