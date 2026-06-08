type Props = {
  className?: string;
};

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[28px] text-white leading-none ${className}`.trim()}
      aria-hidden
    >
      <span className="relative inline-flex size-[1em] items-center justify-center mr-[0.32em] shrink-0">
        <span className="absolute h-[0.72em] w-[0.1em] rounded-full bg-current rotate-45" />
        <span className="absolute h-[0.72em] w-[0.1em] rounded-full bg-current -rotate-45" />
      </span>
      <span className="inline-flex h-[0.72em] items-center gap-[0.21em] shrink-0">
        <span className="w-[0.1em] h-full bg-current rounded-full" />
        <span className="w-[0.1em] h-full bg-current rounded-full" />
      </span>
      <span className="ml-[0.32em] shrink-0 size-[0.72em] rounded-full border-[0.1em] border-current box-border" />
    </span>
  );
}
