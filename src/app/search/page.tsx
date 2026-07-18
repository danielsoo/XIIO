import { Suspense } from "react";
import SearchPage from "@/components/search/SearchPage";

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Suspense fallback={null}>
      <SearchPage initialQuery={q ?? ""} />
    </Suspense>
  );
}
