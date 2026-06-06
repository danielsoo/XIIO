import { FEATURED_STORIES, type HomeStoryItem } from "@/lib/homeMockData";
import { watchHref } from "@/lib/works/catalog-ui";
import type { CatalogFeedItem } from "@/types/work";

const PLACEHOLDER_IMAGES = FEATURED_STORIES.map((story) => story.imageUrl);

export function catalogItemToHomeStory(
  item: CatalogFeedItem,
  index: number
): HomeStoryItem {
  return {
    id: item.id,
    title: item.title,
    category: item.approvedCategory ?? item.section,
    duration: item.approvedTags[0] ?? "",
    imageUrl:
      item.thumbnailUrl ?? PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length] ?? PLACEHOLDER_IMAGES[0],
    href: watchHref(item.ownerUid, item.workId),
  };
}

export function catalogItemsToHomeStories(items: CatalogFeedItem[]): HomeStoryItem[] {
  return items.map(catalogItemToHomeStory);
}
