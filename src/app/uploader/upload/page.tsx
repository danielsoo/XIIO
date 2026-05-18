import { Suspense } from "react";
import UploaderUploadInner from "./UploaderUploadInner";

export default function UploaderUploadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
          <p className="text-xiio-muted">불러오는 중…</p>
        </main>
      }
    >
      <UploaderUploadInner />
    </Suspense>
  );
}
