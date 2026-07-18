import type { ReactNode } from "react";

/** Fixed stage inset so destination copy does not jump when its content height changes. */
export const HERO_COPY_STAGE_CLASS =
  "relative z-10 min-h-[560px] px-6 pb-12 pt-[136px] lg:px-12";

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  eyebrowTone?: "accent" | "gold";
  children?: ReactNode;
};

/** Shared, image-independent copy layout for the primary destination heroes. */
export default function HeroCopy({
  eyebrow,
  title,
  description,
  eyebrowTone = "accent",
  children,
}: Props) {
  return (
    <div className="min-w-0 max-w-[720px]">
      <p
        className={`mb-4 text-xs font-bold uppercase tracking-[0.16em] ${
          eyebrowTone === "gold" ? "text-xiio-gold" : "text-xiio-accent"
        }`}
      >
        {eyebrow}
      </p>
      <h1 className="mb-5 font-serif text-[clamp(3rem,5.2vw,4.7rem)] font-semibold leading-[1.04] text-[#f5f4f2]">
        {title}
      </h1>
      <p className={`max-w-[620px] text-[15px] leading-[1.65] text-white/65 ${children ? "mb-6" : ""}`}>
        {description}
      </p>
      {children}
    </div>
  );
}
