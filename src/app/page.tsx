import { Suspense } from "react";
import HomeMockPage from "@/components/home/HomeMockPage";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-white/50">
          …
        </main>
      }
    >
      <HomeMockPage />
    </Suspense>
  );
}
