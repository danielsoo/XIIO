"use client";

import ProfileOwnerWorkspace from "@/components/profile/ProfileOwnerWorkspace";
import type { PeopleProfilePayload } from "@/components/profile/PeopleProfileView";
import type { ProfessionalProfileSaved } from "@/hooks/useProfessionalProfileSave";
import type { DirectorNameChangeRequest } from "@/types/user";

type Props = {
  data: PeopleProfilePayload;
  handleLocked: boolean;
  onProfileSaved: (saved: ProfessionalProfileSaved) => void;
  onIdentityRequest: (
    field: "displayNameChangeRequest" | "handleChangeRequest",
    req: DirectorNameChangeRequest
  ) => void;
};

export default function PeopleProfileOwnerTabs(props: Props) {
  return (
    <ProfileOwnerWorkspace
      {...props}
      urlMode="people"
      className="max-w-5xl mx-auto"
    />
  );
}
