import { Suspense } from "react";
import UploaderPageLoading from "@/components/uploader/UploaderPageLoading";
import UploaderUploadInner from "./UploaderUploadInner";

export default function UploaderUploadPage() {
  return (
    <Suspense fallback={<UploaderPageLoading />}>
      <UploaderUploadInner />
    </Suspense>
  );
}
