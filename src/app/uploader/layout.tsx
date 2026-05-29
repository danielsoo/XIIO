import UploaderMemberGuard from "@/components/uploader/UploaderMemberGuard";

export default function UploaderLayout({ children }: { children: React.ReactNode }) {
  return <UploaderMemberGuard>{children}</UploaderMemberGuard>;
}
