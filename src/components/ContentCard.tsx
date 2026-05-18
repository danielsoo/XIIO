import Image from "next/image";
import Link from "next/link";

interface ContentCardProps {
  title: string;
  contentCategory?: string;
  tags?: string[];
  gradient: string;
  thumbnailUrl?: string;
  href?: string;
}

export default function ContentCard({
  title,
  contentCategory,
  tags = [],
  gradient,
  thumbnailUrl,
  href,
}: ContentCardProps) {
  const tagLine = tags.length > 0 ? tags.join(" · ") : null;

  const inner = (
    <>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />
      ) : (
        <div className={`absolute inset-0 ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-black ml-0.5" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        {contentCategory && (
          <p className="text-xs font-medium text-white/90 mb-0.5">{contentCategory}</p>
        )}
        {tagLine && <p className="text-[11px] text-xiio-muted mb-0.5 line-clamp-1">{tagLine}</p>}
        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{title}</p>
      </div>
    </>
  );

  const className =
    "group relative block rounded-xl overflow-hidden aspect-video cursor-pointer hover:scale-[1.02] transition-transform duration-200";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={title}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
