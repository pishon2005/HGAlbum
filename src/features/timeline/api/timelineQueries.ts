import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { photosListSchema, type PhotoItem } from '@/entities/photo'

/**
 * Consulta todas las fotos de la pareja ordenadas por taken_at DESC,
 * genera URLs firmadas seguras de Supabase Storage y valida la respuesta con Zod.
 */
export async function fetchTimelinePhotos(coupleId: string): Promise<PhotoItem[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('couple_id', coupleId)
    .order('taken_at', { ascending: false })

  if (error) {
    throw new Error(`Error al cargar los recuerdos: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Generar URLs firmadas en lote para el bucket privado album-media (vigencia 1 hora)
  const paths = data.map((item) => item.storage_path)
  const { data: signedUrls, error: storageError } = await supabase.storage
    .from('album-media')
    .createSignedUrls(paths, 3600)

  if (storageError) {
    console.warn('Advertencia al generar URLs firmadas:', storageError.message)
  }

  const photosWithSignedUrls = data.map((item, index) => {
    const signed = signedUrls?.[index]
    return {
      ...item,
      signedUrl: signed?.signedUrl ?? '',
    }
  })

  // Validación estricta con esquema Zod
  return photosListSchema.parse(photosWithSignedUrls)
}

/**
 * queryOptions de TanStack Query para compartir entre hooks y componentes.
 */
export const timelineQueryOptions = (coupleId: string | null | undefined) =>
  queryOptions({
    queryKey: ['timeline', coupleId],
    queryFn: () => {
      if (!coupleId) return Promise.resolve([])
      return fetchTimelinePhotos(coupleId)
    },
    enabled: Boolean(coupleId),
  })
