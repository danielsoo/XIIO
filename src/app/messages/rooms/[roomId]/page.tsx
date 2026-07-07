"use client";

import { useParams } from "next/navigation";
import RoomConversationPane from "@/components/messages/RoomConversationPane";

export default function RoomThreadPage() {
  const { roomId } = useParams<{ roomId: string }>();
  if (!roomId) return null;
  return <RoomConversationPane roomId={roomId} />;
}
