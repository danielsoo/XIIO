import SeriesDetailPage from "@/components/series/SeriesDetailPage";

type Props = { params: Promise<{ showId: string }> };

export default async function ShowPage({ params }: Props) {
  const { showId } = await params;
  return <SeriesDetailPage seriesId={showId} variant="show" />;
}
