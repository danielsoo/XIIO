import { Suspense } from "react";
import PrologueEditorContent from "@/components/uploader/PrologueEditorContent";

type Props = { params: Promise<{ workId: string }> };

export default async function PrologueEditorPage({ params }: Props) {
  const { workId } = await params;
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
          <p className="text-xiio-muted">Loading…</p>
        </main>
      }
    >
      <PrologueEditorContent workId={workId} />
    </Suspense>
  );
}
