import AdminUserProfile from "@/components/admin/AdminUserProfile";

type Props = { params: Promise<{ uid: string }> };

export default async function AdminUserPage({ params }: Props) {
  const { uid } = await params;
  return <AdminUserProfile uid={uid} />;
}
