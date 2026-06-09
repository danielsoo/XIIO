"use client";

import ProfileWorksVerticalList, {
  type ProfileWorkListItem,
} from "@/components/profile/ProfileWorksVerticalList";

type Props = {
  works: ProfileWorkListItem[];
  isSelf: boolean;
};

export default function SocietyProfileBody({ works, isSelf }: Props) {
  return (
    <div className="mb-10">
      <ProfileWorksVerticalList items={works} isSelf={isSelf} />
    </div>
  );
}
