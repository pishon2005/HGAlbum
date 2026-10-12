export interface Reaction {
  id: string
  photo_id: string
  user_id: string
  emoji: string
  created_at: string
}

/** Reacción enriquecida con el nombre de quien reaccionó */
export interface ReactionWithProfile extends Reaction {
  profiles: { full_name: string } | null
}

export interface ReactionSummary {
  emoji: string
  count: number
  reactedByMe: boolean
  myReactionId: string | null
  userNames: string[]
}

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '🥰', '🔥', '👏'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]
