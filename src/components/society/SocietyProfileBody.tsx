"use client";

import ProfileOwnerPostsPanel from "@/components/profile/ProfileOwnerPostsPanel";
import ProfileWorksVerticalList, {
  type ProfileWorkListItem,
} from "@/components/profile/ProfileWorksVerticalList";

type Props = {
  handle: string;
  works: ProfileWorkListItem[];
  isSelf: boolean;
};

export default function SocietyProfileBody({ handle, works, isSelf }: Props) {
  return (
    <div className="mb-10 flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
      <ProfileWorksVerticalList items={works} isSelf={isSelf} />
      <ProfileOwnerPostsPanel handle={handle} isSelf={isSelf} />
    </div>
  );
}
