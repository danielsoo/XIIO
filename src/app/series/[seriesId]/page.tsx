import SeriesDetailPage from "@/components/series/SeriesDetailPage";

type Props = { params: Promise<{ seriesId: string }> };

export default async function SeriesPage({ params }: Props) {
  const { seriesId } = await params;
  return <SeriesDetailPage seriesId={seriesId} />;
}
