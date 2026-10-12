import { supabase } from '@/shared/lib/supabase'
import { photosListSchema, type PhotoItem } from '../model/schemas'
import type { MediaType } from '../model/types'

export interface PhotoDateRange {
  from?: string
  to?: string
}

export interface PhotoFilters {
  albumId?: string | null
  dateRange?: PhotoDateRange
  mediaType?: MediaType | 'all'
}

function localDateBoundary(date: string, endOfDay = false): string {
  const boundary = new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00'}`)
  if (Number.isNaN(boundary.getTime())) {
    throw new Error('El filtro de fecha no es válido.')
  }
  return boundary.toISOString()
}

export async function getPhotos(
  coupleId: string,
  filters: PhotoFilters = {},
): Promise<PhotoItem[]> {
  let query = supabase
    .from('photos')
    .select('*')
    .eq('couple_id', coupleId)
    .order('taken_at', { ascending: false })

  if (filters.albumId) query = query.eq('album_id', filters.albumId)
  if (filters.mediaType && filters.mediaType !== 'all') {
    query = query.eq('media_type', filters.mediaType)
  }
  if (filters.dateRange?.from) {
    query = query.gte('taken_at', localDateBoundary(filters.dateRange.from))
  }
  if (filters.dateRange?.to) {
    query = query.lte('taken_at', localDateBoundary(filters.dateRange.to, true))
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al cargar los recuerdos: ${error.message}`)
  if (!data?.length) return []

  const { data: signedUrls, error: signedError } = await supabase.storage
    .from('album-media')
    .createSignedUrls(data.map((photo) => photo.storage_path), 3600)

  if (signedError) {
    throw new Error(`Error al generar enlaces seguros para las fotos: ${signedError.message}`)
  }

  const photos = data.map((photo, index) => {
    const signedUrl = signedUrls?.[index]?.signedUrl
    if (!signedUrl) {
      throw new Error(`No se pudo generar el enlace seguro para el recuerdo ${photo.id}.`)
    }
    return { ...photo, signedUrl }
  })

  return photosListSchema.parse(photos)
}
