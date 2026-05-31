"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import HomeHeroActions from "@/components/HomeHeroActions";
import HomeCatalogSection from "@/components/home/HomeCatalogSection";
import PromoShortCarousel from "@/components/shorts/PromoShortCarousel";
import { HOME_HERO_PEEK_VIEWPORT_CLASS } from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import { usePromoFeed } from "@/hooks/usePromoFeed";
import {
  HERO_DESIGN,
  HERO_SECTION_STYLE,
  heroDiagonalGradient,
  heroMobileVerticalGradient,
} from "@/lib/homeHeroLayout";
import type { WorkSection } from "@/types/work";

const HOME_SECTIONS: { href: string; section: WorkSection; titleKey: string }[] = [
  { href: "/movies", section: "movies", titleKey: "nav.movies" },
  { href: "/entertainment", section: "entertainment", titleKey: "nav.entertainment" },
  { href: "/series", section: "series", titleKey: "nav.series" },
  { href: "/school-battle", section: "school-battle", titleKey: "nav.schoolBattle" },
];

export default function HomePageContent() {
  const { t } = useTranslations();
  const { items: promoItems } = usePromoFeed(true);
  const searchParams = useSearchParams();
  const promoId = searchParams.get("promo");
  const [promoIndex, setPromoIndex] = useState(0);
  const hasPromo = promoItems.length > 0;
  const count = promoItems.length;

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const [gradStartPercent, setGradStartPercent] = useState<number>(
    HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent
  );

  useEffect(() => {
    if (!promoId || count === 0) return;
    const i = promoItems.findIndex((s) => s.id === promoId);
    if (i >= 0) setPromoIndex(i);
  }, [promoId, promoItems, count]);

  const onPromoIndexChange = useCallback((next: number) => {
    setPromoIndex(next);
  }, []);

  useLayoutEffect(() => {
    const section = heroSectionRef.current;
    const text = heroTextRef.current;
    if (!section || !text) return;

    const measure = () => {
      const lg = window.matchMedia("(min-width: 1024px)").matches;
      const offset = HERO_DESIGN.gradStartOffsetPercent;
      if (!lg) {
        setGradStartPercent(HERO_DESIGN.gradFlatPercent + offset);
        return;
      }
      const sectionRect = section.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const startPx = Math.max(0, textRect.right - sectionRect.left);
      const base =
        sectionRect.width > 0 ? (startPx / sectionRect.width) * 100 : HERO_DESIGN.gradFlatPercent;
      setGradStartPercent(Math.min(100, Math.round((base + offset) * 10) / 10));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(text);
    window.addEventListener("resize", measure);
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
    };
  }, [hasPromo]);

  return (
    <main className="min-h-screen bg-xiio-bg" style={HERO_SECTION_STYLE}>
      <section
        ref={heroSectionRef}
        className="relative w-full min-h-[clamp(380px,59vh,520px)] overflow-visible"
      >
        {/* 파랑 → transparent (아래 main 검정 비침) */}
        <div
          className="absolute inset-0 z-0 pointer-events-none hidden lg:block"
          aria-hidden
          style={{ background: heroDiagonalGradient(gradStartPercent) }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none lg:hidden"
          aria-hidden
          style={{ background: heroMobileVerticalGradient() }}
        />

        <div
          className="relative z-10 w-full pt-24 pb-12 md:pt-28 md:pb-16"
          style={{ paddingLeft: "var(--hero-pad-x)", paddingRight: "var(--hero-pad-x)" }}
        >
          <div
            className={`w-full max-w-[min(100%,1480px)] mx-auto flex flex-col gap-10 items-stretch ${
              hasPromo
                ? "md:flex-row md:items-center md:justify-between md:gap-[var(--hero-col-gap)]"
                : ""
            }`}
          >
            <div ref={heroTextRef} className={hasPromo ? "min-w-0 max-w-xl shrink-0" : "max-w-2xl"}>
              <h1 className="text-[clamp(28px,3.5vw,56px)] font-black italic text-white mb-4 leading-[1.1] tracking-tight">
                {t("home.heroTitleLine1")}
                <br />
                {t("home.heroTitleLine2")}
              </h1>
              <p className="text-white/75 text-[clamp(10px,1.17vw,14px)] uppercase tracking-widest mb-6 max-w-lg leading-relaxed">
                {t("home.heroSubtitle")}
              </p>
              <HomeHeroActions />
            </div>

            {hasPromo && (
              <div
                className="w-full min-w-0 md:w-auto md:shrink-0 md:ml-auto flex justify-center md:justify-end"
                aria-label={t("home.promoSectionTitle")}
              >
                <PromoShortCarousel
                  items={promoItems}
                  index={promoIndex}
                  onIndexChange={onPromoIndexChange}
                  playerSize="homeHeroSmall"
                  compact
                  viewportClassName={HOME_HERO_PEEK_VIEWPORT_CLASS}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div
        className="pb-16 space-y-12"
        style={{ paddingLeft: "var(--hero-pad-x)", paddingRight: "var(--hero-pad-x)" }}
      >
        {HOME_SECTIONS.map(({ href, section, titleKey }) => (
          <HomeCatalogSection key={href} section={section} href={href} titleKey={titleKey} />
        ))}
      </div>
    </main>
  );
}
