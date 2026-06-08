type Props = {
  className?: string;
};

const XIIO_CAP = "calc((0.72em + 0.1em) / sqrt(2))";
/** X↔II, II↔O 그룹 간격 */
const XIIO_GAP = "0.80em";
/** II 두 막대 사이 간격 */
const XIIO_II_GAP = "0.36em";

/** 회전 후 상·하단이 수평으로 보이도록 끝만 잘림 */
const X_ARM_CLIP_A = "polygon(0% 12%, 100% 0%, 100% 88%, 0% 100%)";
const X_ARM_CLIP_B = "polygon(0% 0%, 100% 12%, 100% 100%, 0% 88%)";

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[28px] text-white leading-none ${className}`.trim()}
      style={{
        ["--xiio-cap" as string]: XIIO_CAP,
        ["--xiio-gap" as string]: XIIO_GAP,
        ["--xiio-ii-gap" as string]: XIIO_II_GAP,
      }}
      aria-hidden
    >
      <span className="relative inline-flex size-[var(--xiio-cap)] items-center justify-center mr-[var(--xiio-gap)] shrink-0">
        <span
          className="absolute h-[0.72em] w-[0.1em] bg-current rotate-45"
          style={{ clipPath: X_ARM_CLIP_A }}
        />
        <span
          className="absolute h-[0.72em] w-[0.1em] bg-current -rotate-45"
          style={{ clipPath: X_ARM_CLIP_B }}
        />
      </span>
      <span className="inline-flex h-[var(--xiio-cap)] items-center gap-[var(--xiio-ii-gap)] shrink-0">
        <span className="w-[0.1em] h-full bg-current" />
        <span className="w-[0.1em] h-full bg-current" />
      </span>
      <span className="ml-[var(--xiio-gap)] shrink-0 size-[var(--xiio-cap)] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
