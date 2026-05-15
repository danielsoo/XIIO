import Link from "next/link";
import ContentCard from "@/components/ContentCard";

const SECTIONS = [
  {
    title: "영화",
    href: "/movies",
    items: [
      { title: "청춘의 끝에서", category: "드라마", gradient: "bg-gradient-to-br from-blue-900 to-purple-900" },
      { title: "어둠 속의 빛", category: "스릴러", gradient: "bg-gradient-to-br from-gray-800 to-gray-900" },
      { title: "우리가 남긴 것들", category: "로맨스", gradient: "bg-gradient-to-br from-pink-900 to-rose-900" },
      { title: "폭풍 전야", category: "액션", gradient: "bg-gradient-to-br from-orange-900 to-red-900" },
    ],
  },
  {
    title: "예능",
    href: "/entertainment",
    items: [
      { title: "웃음 연구소", category: "예능", gradient: "bg-gradient-to-br from-yellow-800 to-amber-900" },
      { title: "리얼 캠퍼스", category: "리얼리티", gradient: "bg-gradient-to-br from-green-800 to-teal-900" },
      { title: "팀장님 왔다", category: "예능", gradient: "bg-gradient-to-br from-indigo-900 to-blue-900" },
      { title: "맛있는 도전", category: "쿡방", gradient: "bg-gradient-to-br from-orange-800 to-yellow-900" },
    ],
  },
  {
    title: "시리즈",
    href: "/series",
    items: [
      { title: "미래도시 2049", category: "SF", gradient: "bg-gradient-to-br from-cyan-900 to-blue-900" },
      { title: "학원의 비밀", category: "미스터리", gradient: "bg-gradient-to-br from-purple-900 to-violet-900" },
      { title: "두 번째 봄", category: "로맨스", gradient: "bg-gradient-to-br from-rose-800 to-pink-900" },
      { title: "도시의 밤", category: "범죄", gradient: "bg-gradient-to-br from-slate-800 to-gray-900" },
    ],
  },
  {
    title: "쇼츠폼",
    href: "/shorts",
    items: [
      { title: "1분 요리", category: "라이프", gradient: "bg-gradient-to-br from-lime-800 to-green-900" },
      { title: "오늘의 챌린지", category: "챌린지", gradient: "bg-gradient-to-br from-violet-800 to-purple-900" },
      { title: "코미디 클립", category: "코미디", gradient: "bg-gradient-to-br from-amber-800 to-orange-900" },
      { title: "여행 로그", category: "여행", gradient: "bg-gradient-to-br from-sky-800 to-blue-900" },
    ],
  },
  {
    title: "학교 대항전",
    href: "/school-battle",
    items: [
      { title: "서울대 vs 연세대", category: "토론", gradient: "bg-gradient-to-br from-red-900 to-rose-900" },
      { title: "전국 댄스 배틀", category: "댄스", gradient: "bg-gradient-to-br from-fuchsia-900 to-pink-900" },
      { title: "코딩 챔피언십", category: "IT", gradient: "bg-gradient-to-br from-teal-900 to-cyan-900" },
      { title: "노래 대전", category: "음악", gradient: "bg-gradient-to-br from-blue-800 to-indigo-900" },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-xiio-bg">
      {/* 히어로 배너 */}
      <section className="relative h-[75vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0a0a20] to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-xiio-accent/20 to-transparent" />
        <div className="relative z-10 px-8 pb-16 md:px-16">
          <div className="inline-block px-3 py-1 rounded-full bg-xiio-accent/20 border border-xiio-accent/40 text-xiio-accent text-xs font-semibold mb-4">
            XIIO 오리지널
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            대학생들이 만드는<br />새로운 콘텐츠
          </h1>
          <p className="text-xiio-muted text-base md:text-lg mb-6 max-w-lg">
            영화, 예능, 시리즈부터 학교 대항전까지 — 다음 세대가 만드는 콘텐츠 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              href="/movies"
              className="inline-flex justify-center px-6 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
            >
              지금 시청하기
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex justify-center px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition font-medium"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center px-6 py-3 rounded-lg border border-xiio-accent/50 text-xiio-accent hover:bg-xiio-accent/10 transition font-medium"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-xiio-bg to-transparent" />
      </section>

      {/* 콘텐츠 섹션 */}
      <div className="px-6 md:px-12 pb-16 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.href}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <Link href={section.href} className="text-sm text-xiio-muted hover:text-xiio-accent transition">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {section.items.map((item) => (
                <ContentCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
