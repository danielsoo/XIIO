import CategoryPageShell from "@/components/category/CategoryPageShell";

const MOVIES = [
  { title: "청춘의 끝에서", category: "드라마", gradient: "bg-gradient-to-br from-blue-900 to-purple-900" },
  { title: "어둠 속의 빛", category: "스릴러", gradient: "bg-gradient-to-br from-gray-800 to-gray-900" },
  { title: "우리가 남긴 것들", category: "로맨스", gradient: "bg-gradient-to-br from-pink-900 to-rose-900" },
  { title: "폭풍 전야", category: "액션", gradient: "bg-gradient-to-br from-orange-900 to-red-900" },
  { title: "마지막 승부", category: "스포츠", gradient: "bg-gradient-to-br from-green-900 to-emerald-900" },
  { title: "숨겨진 진실", category: "미스터리", gradient: "bg-gradient-to-br from-violet-900 to-purple-900" },
  { title: "별빛 아래에서", category: "로맨스", gradient: "bg-gradient-to-br from-indigo-900 to-blue-900" },
  { title: "도시의 고독", category: "드라마", gradient: "bg-gradient-to-br from-slate-800 to-gray-900" },
];

export default function MoviesPage() {
  return (
    <CategoryPageShell titleKey="category.moviesTitle" subtitleKey="category.moviesSubtitle" items={MOVIES} />
  );
}
