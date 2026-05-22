import { redirect } from "next/navigation";
import CategoryPageClient from "@/components/category/CategoryPageClient";

type Props = {
  searchParams: Promise<{ promo?: string }>;
};

export default async function ShortsPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.promo) {
    redirect(`/?promo=${encodeURIComponent(params.promo)}`);
  }

  return (
    <CategoryPageClient
      section="shorts"
      titleKey="category.shortsTitle"
      subtitleKey="category.shortsSubtitle"
    />
  );
}
