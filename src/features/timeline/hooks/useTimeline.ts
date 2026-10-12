import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers'
import { timelineQueryOptions } from '../api/timelineQueries'

/**
 * Hook para consultar las fotos de la pareja en orden cronológico inverso.
 * Usa TanStack Query con la query key estable ['timeline', coupleId].
 */
export const useTimeline = () => {
  const { couple, profile } = useAuth()
  const coupleId = couple?.id || profile?.couple_id

  return useQuery(timelineQueryOptions(coupleId))
}
