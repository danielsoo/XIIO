import { profileInitials } from "@/lib/profileFormStyles";

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export default function ProfileAvatar({
  displayName,
  avatarUrl,
  className = "w-20 h-20 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shrink-0",
  imgClassName = "w-full h-full object-cover",
}: Props) {
  const url = avatarUrl?.trim();
  if (url) {
    return (
      <div className={className} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className={imgClassName} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={className} aria-hidden>
      {profileInitials(displayName)}
    </div>
  );
}
