import { notFound, redirect } from "next/navigation";
import SchoolProfilePage from "@/components/school/SchoolProfilePage";
import {
  computeSchoolStats,
  fetchSchool,
  fetchSchoolWorksFeed,
  sortByPublishedAtDesc,
  sortByViewCountDesc,
  toClientSafeCatalogItem,
  toClientSafeSchool,
} from "@/lib/server/school-feeds";
import { pickSchoolRepresentativeWork } from "@/lib/server/school-representative";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ schoolId: string }> };

export default async function SchoolPage({ params }: Params) {
  const { schoolId } = await params;
  const db = await getDbOrNull();
  if (!db) notFound();

  const school = await fetchSchool(db, schoolId);
  if (!school) notFound();
  if (school.status === "merged" && school.mergedIntoSlug) {
    redirect(`/school/${school.mergedIntoSlug}`);
  }

  const items = await fetchSchoolWorksFeed(db, schoolId, 60);
  const stats = computeSchoolStats(items);
  const representative = pickSchoolRepresentativeWork(items);
  const latest = sortByPublishedAtDesc(items).slice(0, 12);
  const mostViewed = sortByViewCountDesc(items).slice(0, 12);

  return (
    <SchoolProfilePage
      school={toClientSafeSchool(school)}
      stats={stats}
      latest={latest.map(toClientSafeCatalogItem)}
      mostViewed={mostViewed.map(toClientSafeCatalogItem)}
      representative={representative ? toClientSafeCatalogItem(representative) : null}
    />
  );
}
