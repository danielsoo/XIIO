import { Suspense } from "react";
import MyWorksContent from "@/components/uploader/MyWorksContent";

export default function UploaderWorksPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
          <p className="text-xiio-muted">불러오는 중…</p>
        </main>
      }
    >
      <MyWorksContent />
    </Suspense>
  );
}
