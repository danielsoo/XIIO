import { Suspense } from "react";
import HomePageContent from "@/components/home/HomePageContent";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-xiio-bg pt-24 flex items-center justify-center">
          <p className="text-xiio-muted">…</p>
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
