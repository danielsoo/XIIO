type Props = {
  className?: string;
};

const XIIO_CAP = "calc((0.72em + 0.1em) / sqrt(2))";

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[28px] text-white leading-none ${className}`.trim()}
      style={{ ["--xiio-cap" as string]: XIIO_CAP }}
      aria-hidden
    >
      <span className="relative inline-flex size-[var(--xiio-cap)] items-center justify-center mr-[0.32em] shrink-0">
        <span className="absolute h-[0.72em] w-[0.1em] rounded-full bg-current rotate-45" />
        <span className="absolute h-[0.72em] w-[0.1em] rounded-full bg-current -rotate-45" />
      </span>
      <span className="inline-flex h-[var(--xiio-cap)] items-center gap-[0.21em] shrink-0">
        <span className="w-[0.1em] h-full bg-current rounded-full" />
        <span className="w-[0.1em] h-full bg-current rounded-full" />
      </span>
      <span className="ml-[0.32em] shrink-0 size-[var(--xiio-cap)] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
