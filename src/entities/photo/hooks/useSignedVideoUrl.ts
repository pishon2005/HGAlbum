import { queryOptions, useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

/**
 * Genera una signed URL (1 hora) para un video del bucket privado album-media.
 */
export async function getSignedVideoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('album-media')
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    throw new Error(`Error al generar el enlace del video: ${error?.message ?? 'sin URL'}`)
  }
  return data.signedUrl
}

export const signedVideoUrlQueryOptions = (path: string | null | undefined) =>
  queryOptions({
    queryKey: ['signed-video-url', path],
    queryFn: () => getSignedVideoUrl(path!),
    enabled: Boolean(path),
    // Renovar antes de que caduque la URL (1 hora de vigencia)
    staleTime: 1000 * 60 * 50,
  })

/**
 * Hook que devuelve la signed URL de un video, cacheada con TanStack Query.
 * Acepta una URL inicial (p. ej. la ya generada en lote al cargar la galería).
 */
export const useSignedVideoUrl = (
  path: string | null | undefined,
  initialUrl?: string,
) => {
  return useQuery({
    ...signedVideoUrlQueryOptions(path),
    initialData: initialUrl,
  })
}
