export const MESSAGE_REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"] as const;

export type MessageReactionEmoji = (typeof MESSAGE_REACTION_EMOJIS)[number];

export function isAllowedReactionEmoji(v: string): v is MessageReactionEmoji {
  return (MESSAGE_REACTION_EMOJIS as readonly string[]).includes(v);
}
