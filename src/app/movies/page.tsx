import CategoryPageWithHero from "@/components/category/CategoryPageWithHero";

export default function MoviesPage() {
  return (
    <CategoryPageWithHero
      section="movies"
      titleKey="category.moviesTitle"
      subtitleKey="category.filmsSubtitle"
    />
  );
}
