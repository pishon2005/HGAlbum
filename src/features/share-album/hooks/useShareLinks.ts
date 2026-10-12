import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createShareLink,
  getShareLinks,
  revokeShareLink,
  type ShareExpiration,
} from '../api/shareApi'

export const shareLinksQueryKey = (albumId: string) => ['share-links', albumId] as const

/**
 * Lista los enlaces de compartir activos de un álbum.
 */
export const useShareLinks = (albumId: string | null | undefined) => {
  return useQuery({
    queryKey: shareLinksQueryKey(albumId ?? 'none'),
    queryFn: () => getShareLinks(albumId!),
    enabled: Boolean(albumId),
  })
}

/**
 * Mutación que inserta en shared_albums y devuelve el enlace creado (con token).
 */
export const useCreateShareLink = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ albumId, expiration }: { albumId: string; expiration: ShareExpiration }) =>
      createShareLink(albumId, expiration),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shareLinksQueryKey(data.album_id) })
    },
  })
}

/**
 * Mutación que elimina (revoca) un enlace de compartir.
 */
export const useRevokeShareLink = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shareId }: { shareId: string; albumId: string }) =>
      revokeShareLink(shareId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shareLinksQueryKey(variables.albumId) })
    },
  })
}
