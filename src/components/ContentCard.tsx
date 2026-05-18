import Image from "next/image";

interface ContentCardProps {
  title: string;
  contentCategory?: string;
  tags?: string[];
  gradient: string;
  thumbnailUrl?: string;
}

export default function ContentCard({
  title,
  contentCategory,
  tags = [],
  gradient,
  thumbnailUrl,
}: ContentCardProps) {
  const tagLine = tags.length > 0 ? tags.join(" · ") : null;

  return (
    <div className="group relative rounded-xl overflow-hidden aspect-video cursor-pointer hover:scale-105 transition-transform duration-200">
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
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        {contentCategory && (
          <p className="text-xs font-medium text-white/90 mb-0.5">{contentCategory}</p>
        )}
        {tagLine && <p className="text-[11px] text-xiio-muted mb-0.5 line-clamp-1">{tagLine}</p>}
        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{title}</p>
      </div>
    </div>
  );
}
