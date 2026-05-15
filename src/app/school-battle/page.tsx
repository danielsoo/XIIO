import ContentCard from "@/components/ContentCard";

const ITEMS = [
  { title: "서울대 vs 연세대", category: "토론", gradient: "bg-gradient-to-br from-red-900 to-rose-900" },
  { title: "전국 댄스 배틀", category: "댄스", gradient: "bg-gradient-to-br from-fuchsia-900 to-pink-900" },
  { title: "코딩 챔피언십", category: "IT", gradient: "bg-gradient-to-br from-teal-900 to-cyan-900" },
  { title: "노래 대전", category: "음악", gradient: "bg-gradient-to-br from-blue-800 to-indigo-900" },
  { title: "스포츠 왕중왕", category: "스포츠", gradient: "bg-gradient-to-br from-green-900 to-emerald-900" },
  { title: "요리 대학 대결", category: "쿡방", gradient: "bg-gradient-to-br from-orange-800 to-yellow-900" },
  { title: "창업 피치 대회", category: "비즈니스", gradient: "bg-gradient-to-br from-violet-900 to-purple-900" },
  { title: "AI 해커톤", category: "IT", gradient: "bg-gradient-to-br from-sky-900 to-blue-900" },
];

export default function SchoolBattlePage() {
  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-6 md:px-12 pb-16">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-xiio-accent/20 border border-xiio-accent/40 text-xiio-accent text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-xiio-accent animate-pulse" />
          XIIO 시그니처
        </div>
        <h1 className="text-3xl font-black text-white mb-2">학교 대항전</h1>
        <p className="text-xiio-muted text-sm">전국 대학교가 맞붙는 XIIO만의 특별 콘텐츠</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ITEMS.map((m) => <ContentCard key={m.title} {...m} />)}
      </div>
    </main>
  );
}
