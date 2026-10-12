import { supabase } from '@/shared/lib/supabase'

export interface SharedAlbum {
  id: string
  album_id: string
  token: string
  expires_at: string | null
  created_by: string | null
  created_at: string
}

export type ShareExpiration = '24h' | '7d' | '30d' | 'never'

export const SHARE_EXPIRATION_OPTIONS: { value: ShareExpiration; label: string }[] = [
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'never', label: 'Nunca' },
]

function expirationToDate(expiration: ShareExpiration): string | null {
  const now = Date.now()
  switch (expiration) {
    case '24h':
      return new Date(now + 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'never':
      return null
  }
}

export function buildShareUrl(token: string): string {
  return `${window.location.origin}/shared/${token}`
}

export async function getShareLinks(albumId: string): Promise<SharedAlbum[]> {
  const { data, error } = await supabase
    .from('shared_albums')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al cargar los enlaces: ${error.message}`)
  return (data ?? []) as SharedAlbum[]
}

export async function createShareLink(
  albumId: string,
  expiration: ShareExpiration,
): Promise<SharedAlbum> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Debes iniciar sesión para compartir')
  }

  const { data, error } = await supabase
    .from('shared_albums')
    .insert({
      album_id: albumId,
      expires_at: expirationToDate(expiration),
      created_by: userData.user.id,
    })
    .select()
    .single()

  if (error) throw new Error(`Error al crear el enlace: ${error.message}`)
  return data as SharedAlbum
}

export async function revokeShareLink(shareId: string): Promise<void> {
  const { error } = await supabase.from('shared_albums').delete().eq('id', shareId)
  if (error) throw new Error(`Error al revocar el enlace: ${error.message}`)
}
