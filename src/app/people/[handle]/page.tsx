"use client";

import { useParams } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import PeopleProfileView from "@/components/profile/PeopleProfileView";

export default function PeopleProfilePage() {
  const { handle } = useParams<{ handle: string }>();

  return (
    <AppPageShell>
      {handle ? <PeopleProfileView handle={handle} /> : null}
    </AppPageShell>
  );
}
