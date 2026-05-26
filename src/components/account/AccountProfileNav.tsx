"use client";

import type { ReactNode } from "react";
import { useTranslations } from "@/context/LocaleContext";
import {
  PROFILE_SECTION_IDS,
  type ProfileSectionId,
} from "@/lib/profileSections";

export type MainTabId = "activity" | "profile" | "discover";
export type ActivityTabId = "uploads" | "likes" | "watched";

type ActivityTab = { id: ActivityTabId; labelKey: string; count?: number };

type Props = {
  variant: "sidebar" | "mobile";
  mainTab: MainTabId;
  onMainTab: (id: MainTabId) => void;
  mainTabLabels: Record<MainTabId, string>;
  activityTab: ActivityTabId;
  onActivityTab: (id: ActivityTabId) => void;
  activityTabs: ActivityTab[];
  activityLoading: boolean;
  profileSection?: ProfileSectionId;
  onProfileSection?: (id: ProfileSectionId) => void;
};

const MAIN_IDS: MainTabId[] = ["activity", "profile", "discover"];

const SECTION_LABEL_KEYS: Record<ProfileSectionId, string> = {
  about: "accountProfile.sections.about",
  displayName: "accountProfile.sections.displayName",
  handle: "accountProfile.sections.handle",
  discover: "accountProfile.sections.discover",
  portfolio: "accountProfile.sections.portfolio",
  preview: "accountProfile.sections.preview",
};

const SUB_LIST_CLASS = "ml-3 mt-0.5 pl-2 border-l border-white/10 flex flex-col gap-0.5";

function mainBtnClass(active: boolean, sidebar: boolean) {
  if (sidebar) {
    return active
      ? "w-full text-left pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium bg-xiio-accent/20 text-white border-l-2 border-xiio-accent"
      : "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-xiio-muted hover:text-white hover:bg-white/5 transition";
  }
  return active
    ? "shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-xiio-accent text-white"
    : "shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-xiio-muted hover:text-white transition";
}

function subBtnClass(active: boolean, sidebar: boolean) {
  if (sidebar) {
    return active
      ? "w-full text-left pl-5 pr-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white"
      : "w-full text-left pl-5 pr-3 py-2 rounded-lg text-sm text-xiio-muted hover:text-white hover:bg-white/5 transition";
  }
  return active
    ? "shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-white/15 text-white"
    : "shrink-0 px-3 py-2 rounded-lg text-sm font-medium text-xiio-muted hover:text-white transition";
}

function SubList({ children, sidebar }: { children: ReactNode; sidebar: boolean }) {
  if (sidebar) {
    return <div className={SUB_LIST_CLASS}>{children}</div>;
  }
  return <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">{children}</div>;
}

export default function AccountProfileNav({
  variant,
  mainTab,
  onMainTab,
  mainTabLabels,
  activityTab,
  onActivityTab,
  activityTabs,
  activityLoading,
  profileSection = "about",
  onProfileSection,
}: Props) {
  const { t } = useTranslations();
  const sidebar = variant === "sidebar";

  const activitySubNav =
    mainTab === "activity" ? (
      <SubList sidebar={sidebar}>
        {activityTabs.map(({ id, labelKey, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => onActivityTab(id)}
            className={`${subBtnClass(activityTab === id, sidebar)} ${sidebar ? "flex items-center justify-between gap-2" : "inline-flex items-center gap-1.5"}`}
          >
            <span>{t(labelKey)}</span>
            {!activityLoading && count !== undefined && count > 0 && (
              <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md bg-white/10 shrink-0">
                {count}
              </span>
            )}
          </button>
        ))}
      </SubList>
    ) : null;

  const profileSubNav =
    mainTab === "profile" && onProfileSection ? (
      <SubList sidebar={sidebar}>
        {PROFILE_SECTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onProfileSection(id)}
            className={subBtnClass(profileSection === id, sidebar)}
          >
            {t(SECTION_LABEL_KEYS[id])}
          </button>
        ))}
      </SubList>
    ) : null;

  if (sidebar) {
    return (
      <nav className="flex flex-col gap-0.5 py-2 lg:sticky lg:top-28" aria-label={t("accountProfile.title")}>
        {MAIN_IDS.map((id) => (
          <div key={id}>
            <button
              type="button"
              onClick={() => onMainTab(id)}
              className={mainBtnClass(mainTab === id, true)}
            >
              {mainTabLabels[id]}
            </button>
            {id === "activity" && activitySubNav}
            {id === "profile" && profileSubNav}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {MAIN_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onMainTab(id)}
            className={mainBtnClass(mainTab === id, false)}
          >
            {mainTabLabels[id]}
          </button>
        ))}
      </div>
      {activitySubNav}
      {profileSubNav}
    </div>
  );
}
