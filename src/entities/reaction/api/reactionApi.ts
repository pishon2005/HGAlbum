import { supabase } from '@/shared/lib/supabase'
import type { ReactionWithProfile } from '../model/types'

/**
 * Obtiene las reacciones de una o varias fotos, incluyendo el nombre
 * del perfil de quien reaccionó.
 */
export async function getReactions(photoIds: string[]): Promise<ReactionWithProfile[]> {
  if (photoIds.length === 0) return []
  const { data, error } = await supabase
    .from('reactions')
    .select('*, profiles(full_name)')
    .in('photo_id', photoIds)

  if (error) throw new Error(`Error al cargar reacciones: ${error.message}`)
  return (data ?? []) as ReactionWithProfile[]
}

/**
 * Añade una reacción del usuario autenticado a una foto.
 */
export async function addReaction(photoId: string, emoji: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Debes iniciar sesión para reaccionar')
  }

  const { error } = await supabase
    .from('reactions')
    .insert({ photo_id: photoId, user_id: userData.user.id, emoji })

  if (error) throw new Error(`Error al añadir reacción: ${error.message}`)
}

/**
 * Elimina una reacción por su ID.
 */
export async function removeReaction(reactionId: string): Promise<void> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('id', reactionId)

  if (error) throw new Error(`Error al quitar reacción: ${error.message}`)
}
