import AdminPanelLayout from "@/components/admin/AdminPanelLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
