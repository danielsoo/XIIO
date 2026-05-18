import PromoEditorContent from "@/components/uploader/PromoEditorContent";

type Props = { params: Promise<{ workId: string }> };

export default async function PromoEditorPage({ params }: Props) {
  const { workId } = await params;
  return <PromoEditorContent workId={workId} />;
}
