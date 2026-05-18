import { Suspense } from "react";
import ShortsPageContent from "@/components/shorts/ShortsPageContent";

export default function ShortsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-xiio-bg pt-24 flex items-center justify-center">
          <p className="text-xiio-muted">…</p>
        </main>
      }
    >
      <ShortsPageContent />
    </Suspense>
  );
}
