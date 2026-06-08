"use client";

import { useParams } from "next/navigation";
import PeopleProfileView from "@/components/profile/PeopleProfileView";

export default function PeopleProfilePage() {
  const { handle } = useParams<{ handle: string }>();

  return handle ? <PeopleProfileView handle={handle} /> : null;
}
