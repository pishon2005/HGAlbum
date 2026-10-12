import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/app/providers'

/**
 * Suscripción a Supabase Realtime sobre la tabla photos de la pareja.
 * Cuando la otra persona sube, edita o elimina un recuerdo, se invalidan
 * las consultas para que la UI se actualice sin recargar la página.
 *
 * Requiere que la tabla photos tenga Realtime habilitado en Supabase:
 *   alter publication supabase_realtime add table public.photos;
 */
export const usePhotosRealtime = () => {
  const { couple, profile } = useAuth()
  const queryClient = useQueryClient()
  const coupleId = couple?.id || profile?.couple_id

  useEffect(() => {
    if (!coupleId) return

    const channel = supabase
      .channel(`photos-couple-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['photos'] })
          queryClient.invalidateQueries({ queryKey: ['timeline'] })
          queryClient.invalidateQueries({ queryKey: ['albums'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleId, queryClient])
}
