"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeContentRow from "@/components/home/HomeContentRow";
import HomeStoriesPanel, { type HomeStoryPanelItem } from "@/components/home/HomeStoriesPanel";
import HomeSurfaceCampusRow from "@/components/home/HomeSurfaceCampusRow";
import { SequentialVideoLoadProvider } from "@/components/video/SequentialVideoLoadProvider";
import { IconPlay } from "@/components/icons/MockupIcons";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { usePromoFeed } from "@/hooks/usePromoFeed";
import {
  catalogItemsToHomeStories,
  promoToHomeStory,
  watchProgressItemsToHomeStories,
} from "@/lib/categoryCatalogAdapter";
import { FEATURED_STORIES, SELECTS_STORIES, SURFACE_STORIES } from "@/lib/homeMockData";
import { watchHref } from "@/lib/works/catalog-ui";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import type { CatalogFeedItem, PromoFeedItem } from "@/types/work";
import homeHeroImage from "../../../home_hero.webp";
import filmHeroImage from "../../../film_hero.webp";

type Props = {
  initialPromoItems?: PromoFeedItem[];
  initialMovies?: CatalogFeedItem[];
  initialSeries?: CatalogFeedItem[];
};

export default function HomeMockPage({
  initialPromoItems,
  initialMovies,
  initialSeries,
}: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { items: promoItems } = usePromoFeed({
    fallbackToDemo: false,
    initialItems: initialPromoItems,
  });
  const { items: movies } = useCatalogFeed("movies", 8, initialMovies);
  const { items: series } = useCatalogFeed("series", 4, initialSeries);
  const { items: continueWatchingItems } = useContinueWatching();

  const featuredStories = useMemo(
    () => {
      const live = promoItems
        .slice(0, MOCKUP_MEASURES.featuredRowItemCount)
        .map(promoToHomeStory);
      return live.length > 0 ? live : FEATURED_STORIES;
    },
    [promoItems]
  );
  const surfaceStories = useMemo(() => {
    const live = catalogItemsToHomeStories(movies);
    return live.length > 0 ? live : SURFACE_STORIES;
  }, [movies]);
  const selectsStories = useMemo(() => {
    const live = catalogItemsToHomeStories(series);
    return live.length > 0 ? live : SELECTS_STORIES;
  }, [series]);
  const continueWatchingStories = useMemo(
    () => watchProgressItemsToHomeStories(continueWatchingItems),
    [continueWatchingItems]
  );

  const featuredTitle = "Undertow";
  const featuredMeta = "Drama · 2026 · 18 min · USA";
  const featuredWork = movies[0];

  const watchHrefPrimary =
    user && featuredWork?.ownerUid && featuredWork?.workId
      ? watchHref(featuredWork.ownerUid, featuredWork.workId)
      : user
        ? "/movies"
        : "/login";

  const storyItems: HomeStoryPanelItem[] = useMemo(() => {
    const pool = promoItems.length > 1 ? promoItems.slice(1) : promoItems;
    const liveStories = pool
      .filter((promo) => Boolean(promo.ownerUid && promo.workId))
      .slice(0, 5)
      .map((promo) => ({
        id: promo.id,
        title: promo.title,
        meta: promo.director,
        thumbnailUrl: promo.thumbnailUrl,
        videoUrl: promo.videoUrl,
        href: user ? watchHref(promo.ownerUid!, promo.workId!) : "/login",
      }));
    if (liveStories.length > 0) return liveStories;
    return [
      {
        id: "palace-hours",
        title: "Palace Hours",
        meta: "Drama · 18 min",
        thumbnailUrl: filmHeroImage.src,
        href: user ? "/movies" : "/login",
      },
    ];
  }, [promoItems, user]);

  return (
    <SequentialVideoLoadProvider>
    <main className={`min-h-screen min-w-0 w-full ${MOCKUP_HOME.pageShell}`}>
      <section className="relative isolate min-h-[560px] overflow-hidden">
        <Image
          src={homeHeroImage}
          alt="A lighthouse standing in a stormy sea"
          fill
          priority
          unoptimized
          placeholder="blur"
          sizes="(min-width: 1024px) calc(100vw - 220px), 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,13,0.92)_0%,rgba(11,11,13,0.62)_38%,rgba(11,11,13,0.08)_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,13,0.04)_0%,rgba(11,11,13,0.08)_55%,#0b0b0d_100%)]" />

        <div className="relative z-10 grid min-h-[560px] grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-[minmax(0,660px)_minmax(190px,1fr)] lg:px-12">
          <div className="max-w-[620px]">
            <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-xiio-accent">
              Featured Film
            </p>
            <h1 className="mb-5 font-serif text-[clamp(3.2rem,6vw,5.1rem)] font-semibold leading-[1.02] text-[#f5f4f2]">
              {featuredTitle}
            </h1>
            <p className="mb-6 max-w-[430px] text-[15px] leading-[1.65] text-white/70">
              A dockworker&apos;s daughter searches the harbor town for the truth about her father&apos;s last voyage.
              Shot over eleven nights on the Oregon coast.
            </p>
            <p className="mb-7 text-[13px] text-white/50">{featuredMeta}</p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href={watchHrefPrimary}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f5f4f2] px-7 text-[14px] font-semibold text-[#0b0b0d] transition hover:bg-white"
              >
                <IconPlay className="h-3.5 w-3.5" />
                Play
              </Link>
              <Link
                href={user ? "/my-list" : "/login"}
                className="inline-flex h-12 items-center rounded-full border border-white/30 bg-black/15 px-7 text-[14px] font-medium text-white transition hover:bg-white/[0.08]"
              >
                + My List
              </Link>
            </div>
          </div>

          {storyItems.length > 0 ? (
            <div className="hidden justify-self-end lg:block">
              <HomeStoriesPanel label={t("home.mock.storiesLabel")} stories={storyItems} />
            </div>
          ) : null}
        </div>
      </section>

      <div
        className={`relative z-10 bg-xiio-bg px-4 pt-11 lg:px-12 ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col gap-11`}
      >
        {surfaceStories.length > 0 ? (
          <HomeSurfaceCampusRow
            title={t("home.mock.newToSurface")}
            viewAllHref="/movies"
            viewAllLabel={t("home.mock.viewAll")}
            items={surfaceStories}
          />
        ) : null}

        {continueWatchingStories.length > 0 ? (
          <HomeContentRow
            title={t("home.mock.continueWatching")}
            viewAllHref="/my-list"
            viewAllLabel={t("home.mock.viewAll")}
            items={continueWatchingStories}
            variant="featured"
          />
        ) : null}

        {featuredStories.length > 0 ? (
          <HomeContentRow
            title={t("home.mock.featuredStories")}
            viewAllHref="/movies"
            viewAllLabel={t("home.mock.viewAll")}
            items={featuredStories}
            variant="featured"
          />
        ) : null}

        {selectsStories.length > 0 ? (
          <HomeContentRow
            title={t("home.mock.xiioSelects")}
            viewAllHref="/series"
            viewAllLabel={t("home.mock.viewAll")}
            items={selectsStories}
            variant="selects"
          />
        ) : null}
      </div>

      <AdminHomeColorPicker />
    </main>
    </SequentialVideoLoadProvider>
  );
}
