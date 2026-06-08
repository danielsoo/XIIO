type Props = {
  className?: string;
};

const XIIO_CAP = "calc((0.72em + 0.1em) / sqrt(2))";
/** X↔II, II↔O 그룹 간격 */
const XIIO_GAP = "0.80em";
/** II 두 막대 사이 간격 */
const XIIO_II_GAP = "0.36em";

function XiioWordmarkX() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-full"
      aria-hidden
    >
      <polygon points="7,5 11,5 17,19 13,19" />
      <polygon points="13,5 17,5 11,19 7,19" />
    </svg>
  );
}

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
      <span className="inline-flex size-[var(--xiio-cap)] items-center justify-center mr-[var(--xiio-gap)] shrink-0">
        <XiioWordmarkX />
      </span>
      <span className="inline-flex h-[var(--xiio-cap)] items-center gap-[var(--xiio-ii-gap)] shrink-0">
        <span className="w-[0.1em] h-full bg-current" />
        <span className="w-[0.1em] h-full bg-current" />
      </span>
      <span className="ml-[var(--xiio-gap)] shrink-0 size-[var(--xiio-cap)] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
