import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ promo?: string }>;
};

export default async function ShortsPage({ searchParams }: Props) {
  const params = await searchParams;
  const promo = params.promo?.trim();
  if (promo) {
    redirect(`/?promo=${encodeURIComponent(promo)}`);
  }
  redirect("/");
}
