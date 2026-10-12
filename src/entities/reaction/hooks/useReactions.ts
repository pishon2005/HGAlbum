import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addReaction, getReactions, removeReaction } from '../api/reactionApi'
import type { ReactionSummary, ReactionWithProfile } from '../model/types'

export const reactionsQueryKey = (photoId: string) => ['reactions', photoId] as const

/**
 * Consulta las reacciones de una foto concreta.
 */
export const useReactions = (photoId: string | null | undefined) => {
  return useQuery({
    queryKey: reactionsQueryKey(photoId ?? 'none'),
    queryFn: () => getReactions([photoId!]),
    enabled: Boolean(photoId),
  })
}

/**
 * Consulta las reacciones de varias fotos en una sola petición
 * (usado por el mosaico para mostrar contadores en cada tarjeta).
 */
export const useReactionsBatch = (photoIds: string[]) => {
  return useQuery({
    queryKey: ['reactions', 'batch', [...photoIds].sort()],
    queryFn: () => getReactions(photoIds),
    enabled: photoIds.length > 0,
  })
}

/**
 * Mutación para añadir una reacción e invalidar la caché.
 */
export const useAddReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ photoId, emoji }: { photoId: string; emoji: string }) =>
      addReaction(photoId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions'] })
    },
  })
}

/**
 * Mutación para eliminar una reacción por su ID e invalidar la caché.
 */
export const useRemoveReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reactionId: string) => removeReaction(reactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions'] })
    },
  })
}

/**
 * Agrupa las reacciones de una foto por emoji: contador, si el usuario
 * actual ya reaccionó (y con qué ID) y los nombres de quienes reaccionaron.
 */
export function summarizeReactions(
  reactions: ReactionWithProfile[],
  photoId: string,
  currentUserId: string | undefined,
): ReactionSummary[] {
  const forPhoto = reactions.filter((r) => r.photo_id === photoId)
  const byEmoji = new Map<string, ReactionSummary>()

  for (const reaction of forPhoto) {
    const entry =
      byEmoji.get(reaction.emoji) ?? {
        emoji: reaction.emoji,
        count: 0,
        reactedByMe: false,
        myReactionId: null,
        userNames: [],
      }
    entry.count += 1
    entry.userNames.push(reaction.profiles?.full_name ?? 'Alguien')
    if (reaction.user_id === currentUserId) {
      entry.reactedByMe = true
      entry.myReactionId = reaction.id
    }
    byEmoji.set(reaction.emoji, entry)
  }

  return Array.from(byEmoji.values()).sort((a, b) => b.count - a.count)
}
