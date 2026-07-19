import Image from "next/image";

type Props = {
  className?: string;
};

export default function XiioWordmark({ className = "" }: Props) {
  return (
    <Image
      src="/images/brand/xiio_logo_small.png"
      alt=""
      width={574}
      height={120}
      sizes="120px"
      unoptimized
      aria-hidden
      className={`h-[25px] w-auto shrink-0 object-contain ${className}`.trim()}
    />
  );
}
