import { Suspense } from "react";
import SocietyPage from "@/components/society/SocietyPage";

function SocietyPageFallback() {
  return <div className="min-h-[40vh]" aria-hidden />;
}

export default function SocietyRoutePage() {
  return (
    <Suspense fallback={<SocietyPageFallback />}>
      <SocietyPage />
    </Suspense>
  );
}
