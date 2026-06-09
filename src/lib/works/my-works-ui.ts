import type { HomeStoryItem } from "@/lib/homeMockData";
import { watchHref } from "@/lib/works/catalog-ui";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { WorkListItem } from "@/types/work";

export function thumbnailForWork(work: WorkListItem): string | null {
  const url =
    work.promo?.thumbnailUrl ??
    work.promoDraft?.thumbnailUrl ??
    work.prologue?.thumbnailUrl ??
    null;
  return url?.trim() || null;
}

export function workListItemToHomeStory(work: WorkListItem, uid: string): HomeStoryItem {
  const category =
    (work.platformStatus === "published" ? work.approvedCategory : work.proposedCategory) ??
    work.section;
  const tags = work.platformStatus === "published" ? work.approvedTags : work.proposedTags;
  const crop = work.promo?.thumbnailCrop ?? work.promoDraft?.thumbnailCrop;

  return {
    id: work.id,
    title: work.title,
    category,
    duration: tags?.[0] ?? "",
    imageUrl: thumbnailForWork(work) ?? "",
    href: watchHref(uid, work.id),
    imageStyle: crop ? promoCropToVideoStyle(crop) : undefined,
  };
}

export function publishedWorksForRow(works: WorkListItem[], uid: string): HomeStoryItem[] {
  return works
    .filter((w) => w.platformStatus === "published" && thumbnailForWork(w))
    .map((w) => workListItemToHomeStory(w, uid));
}
