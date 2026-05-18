import CategoryPageShell from "@/components/category/CategoryPageShell";

const ITEMS = [
  { title: "1분 요리", category: "라이프", gradient: "bg-gradient-to-br from-lime-800 to-green-900" },
  { title: "오늘의 챌린지", category: "챌린지", gradient: "bg-gradient-to-br from-violet-800 to-purple-900" },
  { title: "코미디 클립", category: "코미디", gradient: "bg-gradient-to-br from-amber-800 to-orange-900" },
  { title: "여행 로그", category: "여행", gradient: "bg-gradient-to-br from-sky-800 to-blue-900" },
  { title: "30초 뉴스", category: "뉴스", gradient: "bg-gradient-to-br from-red-900 to-rose-900" },
  { title: "댄스 챌린지", category: "댄스", gradient: "bg-gradient-to-br from-fuchsia-900 to-pink-900" },
  { title: "공부 팁", category: "교육", gradient: "bg-gradient-to-br from-teal-800 to-cyan-900" },
  { title: "캠퍼스 미니 다큐", category: "다큐", gradient: "bg-gradient-to-br from-stone-800 to-gray-900" },
];

export default function ShortsPage() {
  return (
    <CategoryPageShell titleKey="category.shortsTitle" subtitleKey="category.shortsSubtitle" items={ITEMS} />
  );
}
