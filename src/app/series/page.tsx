import ContentCard from "@/components/ContentCard";

const ITEMS = [
  { title: "미래도시 2049", category: "SF", gradient: "bg-gradient-to-br from-cyan-900 to-blue-900" },
  { title: "학원의 비밀", category: "미스터리", gradient: "bg-gradient-to-br from-purple-900 to-violet-900" },
  { title: "두 번째 봄", category: "로맨스", gradient: "bg-gradient-to-br from-rose-800 to-pink-900" },
  { title: "도시의 밤", category: "범죄", gradient: "bg-gradient-to-br from-slate-800 to-gray-900" },
  { title: "청춘 크로니클", category: "드라마", gradient: "bg-gradient-to-br from-blue-800 to-indigo-900" },
  { title: "이상한 룸메", category: "코미디", gradient: "bg-gradient-to-br from-amber-800 to-yellow-900" },
  { title: "연결 고리", category: "스릴러", gradient: "bg-gradient-to-br from-red-900 to-orange-900" },
  { title: "밤의 캠퍼스", category: "호러", gradient: "bg-gradient-to-br from-gray-900 to-neutral-900" },
];

export default function SeriesPage() {
  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-6 md:px-12 pb-16">
      <h1 className="text-3xl font-black text-white mb-2">시리즈</h1>
      <p className="text-xiio-muted text-sm mb-8">에피소드로 이어지는 XIIO 오리지널 시리즈</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ITEMS.map((m) => <ContentCard key={m.title} {...m} />)}
      </div>
    </main>
  );
}
