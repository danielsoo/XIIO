import WatchPageContent from "@/components/watch/WatchPageContent";

type Props = { params: Promise<{ ownerUid: string; workId: string }> };

export default async function WatchPage({ params }: Props) {
  const { ownerUid, workId } = await params;
  return <WatchPageContent ownerUid={ownerUid} workId={workId} />;
}
