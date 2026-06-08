import { Suspense } from "react";
import HomeMockPage from "@/components/home/HomeMockPage";
import { getServerHomeFeeds } from "@/lib/server/home-feeds";

export default async function HomePage() {
  const { promoItems, movies, series } = await getServerHomeFeeds();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-white/50">
          …
        </main>
      }
    >
      <HomeMockPage
        initialPromoItems={promoItems}
        initialMovies={movies}
        initialSeries={series}
      />
    </Suspense>
  );
}
