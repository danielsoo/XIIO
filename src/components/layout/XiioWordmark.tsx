type Props = {
  className?: string;
};

const XIIO_CAP = "calc((0.72em + 0.1em) / sqrt(2))";
const XIIO_STROKE = "0.1em";
/** O 외곽 직경 — II cap + 스트로크 1회분 */
const XIIO_O_SIZE = `calc(var(--xiio-cap) + ${XIIO_STROKE})`;
/** X↔II, II↔O 그룹 간격 */
const XIIO_GAP = "0.80em";
/** II 두 막대 사이 간격 */
const XIIO_II_GAP = "0.36em";

/** clip-path 양 끝 trim — polygon %와 보정 높이에 공용 */
const X_CLIP_TRIM = 0.12;
const X_CLIP_TRIM_PCT = `${X_CLIP_TRIM * 100}%`;
const X_CLIP_KEEP = 1 - 2 * X_CLIP_TRIM;
const X_CLIP_END_PCT = `${(1 - X_CLIP_TRIM) * 100}%`;

/** clip 손실 보정 — II·O cap 높이와 시각 정렬 */
const XIIO_X_ARM = `calc(0.72em / ${X_CLIP_KEEP})`;

/** 회전 후 상·하단이 수평으로 보이도록 끝만 잘림 */
const X_ARM_CLIP_A = `polygon(0% ${X_CLIP_TRIM_PCT}, 100% 0%, 100% ${X_CLIP_END_PCT}, 0% 100%)`;
const X_ARM_CLIP_B = `polygon(0% 0%, 100% ${X_CLIP_TRIM_PCT}, 100% 100%, 0% ${X_CLIP_END_PCT})`;

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[28px] text-white leading-none ${className}`.trim()}
      style={{
        ["--xiio-cap" as string]: XIIO_CAP,
        ["--xiio-gap" as string]: XIIO_GAP,
        ["--xiio-ii-gap" as string]: XIIO_II_GAP,
        ["--xiio-x-arm" as string]: XIIO_X_ARM,
        ["--xiio-o-size" as string]: XIIO_O_SIZE,
      }}
      aria-hidden
    >
      <span className="relative inline-flex size-[var(--xiio-cap)] items-center justify-center overflow-visible mr-[var(--xiio-gap)] shrink-0">
        <span
          className="absolute h-[var(--xiio-x-arm)] w-[0.1em] bg-current rotate-45"
          style={{ clipPath: X_ARM_CLIP_A }}
        />
        <span
          className="absolute h-[var(--xiio-x-arm)] w-[0.1em] bg-current -rotate-45"
          style={{ clipPath: X_ARM_CLIP_B }}
        />
      </span>
      <span className="inline-flex h-[var(--xiio-cap)] items-center gap-[var(--xiio-ii-gap)] shrink-0">
        <span className="w-[0.1em] h-full bg-current" />
        <span className="w-[0.1em] h-full bg-current" />
      </span>
      <span className="ml-[var(--xiio-gap)] shrink-0 size-[var(--xiio-o-size)] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
