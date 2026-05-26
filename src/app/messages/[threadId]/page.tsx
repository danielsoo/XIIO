"use client";

import { useParams } from "next/navigation";
import DmConversationPane from "@/components/messages/DmConversationPane";

export default function MessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  if (!threadId) return null;
  return <DmConversationPane threadId={threadId} />;
}
