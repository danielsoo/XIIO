"use client";

import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";

export default function CampusSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className={MOCKUP_CAMPUS.sectionLabelRow}>
      <span className={MOCKUP_CAMPUS.sectionDot} />
      <h2 className={MOCKUP_CAMPUS.sectionLabel}>{children}</h2>
    </div>
  );
}
