import WorkRevisionEditorContent from "@/components/uploader/WorkRevisionEditorContent";

type Props = { params: Promise<{ workId: string }> };

export default async function WorkRevisionPage({ params }: Props) {
  const { workId } = await params;
  return <WorkRevisionEditorContent workId={workId} />;
}
