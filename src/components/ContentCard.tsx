interface ContentCardProps {
  title: string;
  category: string;
  gradient: string;
}

export default function ContentCard({ title, category, gradient }: ContentCardProps) {
  return (
    <div className="group relative rounded-xl overflow-hidden aspect-video cursor-pointer hover:scale-105 transition-transform duration-200">
      <div className={`absolute inset-0 ${gradient}`} />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs text-xiio-muted mb-0.5">{category}</p>
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
      </div>
    </div>
  );
}
