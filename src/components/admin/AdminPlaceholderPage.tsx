import Link from "next/link";

export default function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <Link href="/admin" className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-4 inline-block">
        ← 대시보드
      </Link>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-xiio-muted text-sm">{description}</p>
      <p className="text-xiio-muted text-sm mt-4">이 메뉴는 다음 단계에서 연결됩니다.</p>
    </div>
  );
}
