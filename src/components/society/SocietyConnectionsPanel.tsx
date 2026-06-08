"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import SocietyCreatorRow from "@/components/society/SocietyCreatorRow";
import {
  MOCK_INTEREST_TAGS,
  MOCK_SCHOOLS,
  SOCIETY_SORT_OPTIONS,
  mockSchoolForUid,
  mockTagsForPerson,
  type SocietySortId,
} from "@/lib/societyMockData";
import type { SocietyPerson } from "@/lib/societyTypes";
import type { ProfileRoleTag } from "@/types/portfolio";

type TabId = "discover" | "connections" | "requests" | "sent";

const ROLE_OPTIONS: { value: "" | ProfileRoleTag; labelKey: string }[] = [
  { value: "", labelKey: "society.filterAllRoles" },
  { value: "director", labelKey: "network.field.director" },
  { value: "actor", labelKey: "network.field.actor" },
  { value: "crew", labelKey: "network.field.crew" },
];

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative min-w-[120px] shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-8 py-2 text-center text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-xiio-accent/30"
      >
        {options.map((opt) => (
          <option key={opt.value || "all"} value={opt.value} className="bg-[#0c0e12]">
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" aria-hidden>
        ▾
      </span>
    </label>
  );
}

export default function SocietyConnectionsPanel() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [tab, setTab] = useState<TabId>("discover");
  const [role, setRole] = useState<"" | ProfileRoleTag>("");
  const [school, setSchool] = useState("");
  const [interest, setInterest] = useState("");
  const [sort, setSort] = useState<SocietySortId>("recent");
  const [people, setPeople] = useState<SocietyPerson[]>([]);
  const [connectedUids, setConnectedUids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const loadFollowingSet = useCallback(async () => {
    if (!user) {
      setConnectedUids(new Set());
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/discover/people?followingOnly=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { people?: SocietyPerson[] };
      setConnectedUids(new Set((data.people ?? []).map((p) => p.uid)));
    } catch {
      /* ignore */
    }
  }, [user]);

  const load = useCallback(async () => {
    if (tab === "requests" || tab === "sent") {
      setLoading(false);
      setPeople([]);
      setErr(null);
      return;
    }
    if (!user) {
      setLoading(false);
      setPeople([]);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (tab === "connections") params.set("followingOnly", "1");
      if (role) params.set("role", role);
      const res = await fetch(`/api/discover/people?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setErr(t("society.loadError"));
        setPeople([]);
        return;
      }
      const data = (await res.json()) as { people?: SocietyPerson[] };
      setPeople(data.people ?? []);
    } catch {
      setErr(t("society.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, tab, role, t]);

  useEffect(() => {
    void loadFollowingSet();
  }, [loadFollowingSet]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredPeople = useMemo(() => {
    let list = [...people];
    if (school) {
      list = list.filter((p) => mockSchoolForUid(p.uid) === school);
    }
    if (interest) {
      list = list.filter((p) => mockTagsForPerson(p.uid, p.roleTags, p.headline).includes(interest));
    }
    if (sort === "name") {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return list;
  }, [people, school, interest, sort]);

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: "discover", labelKey: "society.tabDiscover" },
    { id: "connections", labelKey: "society.tabConnections" },
    { id: "requests", labelKey: "society.tabRequests" },
    { id: "sent", labelKey: "society.tabSent" },
  ];

  const handleConnect = async (person: SocietyPerson) => {
    if (!user) return;
    setBusyUid(person.uid);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/follows/${person.uid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConnectedUids((prev) => new Set([...prev, person.uid]));
      }
    } finally {
      setBusyUid(null);
    }
  };

  const schoolOptions = useMemo(
    () => [
      { value: "", label: t("society.filterAllSchools") },
      ...MOCK_SCHOOLS.map((s) => ({ value: s, label: s })),
    ],
    [t]
  );

  const interestOptions = useMemo(
    () => [
      { value: "", label: t("society.filterAllInterests") },
      ...MOCK_INTEREST_TAGS.map((tag) => ({ value: tag, label: tag })),
    ],
    [t]
  );

  const sortOptions = SOCIETY_SORT_OPTIONS.map((o) => ({
    value: o.id,
    label: t(o.labelKey),
  }));

  const roleOptions = ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));

  const emptyMessage =
    tab === "requests"
      ? t("society.emptyRequests")
      : tab === "sent"
        ? t("society.emptySent")
        : t("society.empty");

  return (
    <div className="min-w-0 flex-1">
      <nav className="flex gap-6 overflow-x-auto border-b border-white/10" aria-label="Connections tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 pb-3 text-sm font-medium transition ${
              tab === item.id
                ? "border-b-2 border-xiio-accent text-white"
                : "text-white/45 hover:text-white/70"
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {tab !== "requests" && tab !== "sent" ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <FilterSelect
            label={t("society.filterAllRoles")}
            value={role}
            onChange={(v) => setRole(v as "" | ProfileRoleTag)}
            options={roleOptions}
          />
          <FilterSelect
            label={t("society.filterAllSchools")}
            value={school}
            onChange={setSchool}
            options={schoolOptions}
          />
          <FilterSelect
            label={t("society.filterAllInterests")}
            value={interest}
            onChange={setInterest}
            options={interestOptions}
          />
          <FilterSelect
            label={t("society.sortRecent")}
            value={sort}
            onChange={(v) => setSort(v as SocietySortId)}
            options={sortOptions}
          />
        </div>
      ) : null}

      <div className="mt-6 divide-y divide-white/10">
        {!user && tab !== "requests" && tab !== "sent" ? (
          <p className="text-sm text-white/50">
            {t("society.loginRequired")}{" "}
            <Link href="/login" className="text-xiio-accent hover:underline">
              {t("common.login")}
            </Link>
          </p>
        ) : null}

        {loading ? <p className="text-sm text-white/45">{t("common.loading")}</p> : null}
        {err ? <p className="text-sm text-red-400">{err}</p> : null}

        {!loading && !err && filteredPeople.length === 0 ? (
          <p className="text-sm text-white/45">{emptyMessage}</p>
        ) : null}

        {!loading &&
          filteredPeople.map((person) => (
            <SocietyCreatorRow
              key={person.uid}
              person={person}
              connected={tab === "connections" || connectedUids.has(person.uid)}
              connectBusy={busyUid === person.uid}
              onConnect={() => void handleConnect(person)}
            />
          ))}
      </div>
    </div>
  );
}
