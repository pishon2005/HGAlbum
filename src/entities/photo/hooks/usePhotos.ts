import { queryOptions, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers'
import { getPhotos, type PhotoFilters } from '../api/photoApi'

export const photosQueryOptions = (
  coupleId: string | null | undefined,
  filters: PhotoFilters = {},
) =>
  queryOptions({
    queryKey: [
      'photos',
      {
        coupleId,
        albumId: filters.albumId ?? null,
        dateRange: filters.dateRange ?? null,
        mediaType: filters.mediaType ?? 'all',
      },
    ] as const,
    queryFn: () => {
      if (!coupleId) return Promise.resolve([])
      return getPhotos(coupleId, filters)
    },
    enabled: Boolean(coupleId),
  })

export const usePhotos = (filters: PhotoFilters = {}) => {
  const { couple, profile } = useAuth()
  const coupleId = couple?.id || profile?.couple_id
  return useQuery(photosQueryOptions(coupleId, filters))
}
