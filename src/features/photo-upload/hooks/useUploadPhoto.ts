import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/app/providers'
import type { Photo, MediaType } from '@/entities/photo'
import { extractExifDate } from '../lib/extractExif'
import type { UploadPhotoParams } from '../model/types'

export const useUploadPhoto = () => {
  const { user, profile, couple } = useAuth()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPhoto = useCallback(
    async ({
      file,
      albumId,
      title,
      description,
      takenAt,
    }: UploadPhotoParams): Promise<Photo> => {
      const coupleId = couple?.id || profile?.couple_id
      const userId = user?.id

      if (!coupleId || !userId) {
        throw new Error(
          'Debes estar vinculado a una pareja para poder subir recuerdos.',
        )
      }

      setIsUploading(true)
      setError(null)

      try {
        // 1. Determinar tipo de medio
        const isVideo = file.type.startsWith('video/')
        const mediaType: MediaType = isVideo ? 'video' : 'photo'

        // 2. Extraer o determinar fecha taken_at
        let finalTakenAt: string
        if (takenAt) {
          finalTakenAt =
            takenAt instanceof Date ? takenAt.toISOString() : new Date(takenAt).toISOString()
        } else {
          const exifDate = await extractExifDate(file)
          finalTakenAt = exifDate ? exifDate.toISOString() : new Date().toISOString()
        }

        // 3. Generar UUID y ruta en Supabase Storage: {couple_id}/{photo_id}.{extension}
        const photoId = crypto.randomUUID()
        const rawExt = file.name.includes('.') ? file.name.split('.').pop() : ''
        const extension = (rawExt || (isVideo ? 'mp4' : 'jpg')).toLowerCase()
        const storagePath = `${coupleId}/${photoId}.${extension}`

        // 4. Subir archivo a Supabase Storage (bucket privado 'album-media')
        const { error: storageError } = await supabase.storage
          .from('album-media')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (storageError) {
          throw new Error(`Error al subir archivo a Storage: ${storageError.message}`)
        }

        // 5. Insertar registro en la tabla photos
        const { data: photoRecord, error: dbError } = await supabase
          .from('photos')
          .insert({
            id: photoId,
            album_id: albumId || null,
            couple_id: coupleId,
            uploaded_by: userId,
            storage_path: storagePath,
            media_type: mediaType,
            title: title?.trim() || null,
            description: description?.trim() || null,
            taken_at: finalTakenAt,
          })
          .select()
          .single()

        if (dbError) {
          // Si falló la inserción en base de datos, intentar limpiar el archivo subido en storage
          await supabase.storage.from('album-media').remove([storagePath])
          throw new Error(`Error al guardar datos de la foto: ${dbError.message}`)
        }

        // Invalidar las consultas de fotos para que la UI se actualice sin recargar
        queryClient.invalidateQueries({ queryKey: ['photos'] })
        queryClient.invalidateQueries({ queryKey: ['timeline'] })
        queryClient.invalidateQueries({ queryKey: ['albums'] })

        return photoRecord as Photo
      } catch (err) {
        const message = (err as Error).message || 'Error inesperado durante la subida'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [user, profile, couple],
  )

  return {
    uploadPhoto,
    isUploading,
    error,
  }
}
