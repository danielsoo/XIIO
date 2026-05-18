import CategoryPageShell from "@/components/category/CategoryPageShell";

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
    <CategoryPageShell
      titleKey="category.schoolBattleTitle"
      subtitleKey="category.schoolBattleSubtitle"
      badgeKey="category.schoolBattleBadge"
      items={ITEMS}
    />
  );
}
