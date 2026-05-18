import CategoryPageShell from "@/components/category/CategoryPageShell";

const ITEMS = [
  { title: "웃음 연구소", category: "예능", gradient: "bg-gradient-to-br from-yellow-800 to-amber-900" },
  { title: "리얼 캠퍼스", category: "리얼리티", gradient: "bg-gradient-to-br from-green-800 to-teal-900" },
  { title: "팀장님 왔다", category: "예능", gradient: "bg-gradient-to-br from-indigo-900 to-blue-900" },
  { title: "맛있는 도전", category: "쿡방", gradient: "bg-gradient-to-br from-orange-800 to-yellow-900" },
  { title: "대학생 라이프", category: "브이로그", gradient: "bg-gradient-to-br from-pink-800 to-rose-900" },
  { title: "공대생 생존기", category: "코미디", gradient: "bg-gradient-to-br from-cyan-900 to-teal-900" },
  { title: "밤새 게임", category: "게임", gradient: "bg-gradient-to-br from-violet-900 to-purple-900" },
  { title: "캠퍼스 탐방", category: "여행", gradient: "bg-gradient-to-br from-sky-800 to-blue-900" },
];

export default function EntertainmentPage() {
  return (
    <CategoryPageShell
      titleKey="category.entertainmentTitle"
      subtitleKey="category.entertainmentSubtitle"
      items={ITEMS}
    />
  );
}
