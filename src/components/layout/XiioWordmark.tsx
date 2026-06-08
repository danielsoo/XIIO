type Props = {
  className?: string;
};

const XIIO_CAP = "calc((0.72em + 0.1em) / sqrt(2))";
/** X↔II, II↔O 그룹 간격 — 자간 조절은 이 값만 변경 */
const XIIO_GAP = "0.80em";

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[28px] text-white leading-none ${className}`.trim()}
      style={{ ["--xiio-cap" as string]: XIIO_CAP, ["--xiio-gap" as string]: XIIO_GAP }}
      aria-hidden
    >
      <span className="relative inline-flex size-[var(--xiio-cap)] items-center justify-center mr-[var(--xiio-gap)] shrink-0">
        <span className="absolute h-[0.72em] w-[0.1em] bg-current rotate-45" />
        <span className="absolute h-[0.72em] w-[0.1em] bg-current -rotate-45" />
      </span>
      <span className="inline-flex h-[var(--xiio-cap)] items-center gap-[0.21em] shrink-0">
        <span className="w-[0.1em] h-full bg-current" />
        <span className="w-[0.1em] h-full bg-current" />
      </span>
      <span className="ml-[var(--xiio-gap)] shrink-0 size-[var(--xiio-cap)] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
