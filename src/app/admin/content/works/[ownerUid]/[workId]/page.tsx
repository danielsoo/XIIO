import AdminWorkDetail from "@/components/admin/AdminWorkDetail";

type Props = { params: Promise<{ ownerUid: string; workId: string }> };

export default async function AdminWorkPage({ params }: Props) {
  const { ownerUid, workId } = await params;
  return <AdminWorkDetail ownerUid={ownerUid} workId={workId} />;
}
