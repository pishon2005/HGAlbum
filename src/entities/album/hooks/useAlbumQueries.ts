import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { useAuth } from '@/app/providers'
import {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from '../api/albumApi'
import type { CreateAlbumInput, UpdateAlbumInput } from '../model/types'

export const albumsQueryOptions = (coupleId: string | null | undefined) =>
  queryOptions({
    queryKey: ['albums', coupleId],
    queryFn: () => {
      if (!coupleId) return Promise.resolve([])
      return getAlbums(coupleId)
    },
    enabled: Boolean(coupleId),
  })

export const albumQueryOptions = (albumId: string | null | undefined) =>
  queryOptions({
    queryKey: ['album', albumId],
    queryFn: () => {
      if (!albumId) return Promise.resolve(null)
      return getAlbumById(albumId)
    },
    enabled: Boolean(albumId),
  })

/**
 * Consulta la lista de todos los álbumes de la pareja activa.
 */
export const useAlbums = () => {
  const { couple, profile } = useAuth()
  const coupleId = couple?.id || profile?.couple_id
  return useQuery(albumsQueryOptions(coupleId))
}

/**
 * Consulta un álbum por su ID.
 */
export const useAlbum = (albumId: string | null | undefined) => {
  return useQuery(albumQueryOptions(albumId))
}

/**
 * Mutación para crear un nuevo álbum e invalidar la caché.
 */
export const useCreateAlbum = () => {
  const queryClient = useQueryClient()
  const { couple, profile } = useAuth()
  const coupleId = couple?.id || profile?.couple_id

  return useMutation({
    mutationFn: (data: Omit<CreateAlbumInput, 'couple_id'>) => {
      if (!coupleId) throw new Error('No se encontró una pareja vinculada')
      return createAlbum({ ...data, couple_id: coupleId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}

/**
 * Mutación para actualizar un álbum e invalidar su caché y la lista.
 */
export const useUpdateAlbum = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlbumInput }) =>
      updateAlbum(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['album', variables.id] })
    },
  })
}

/**
 * Mutación para eliminar un álbum.
 */
export const useDeleteAlbum = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
