import type { Photo, MediaType } from '@/entities/photo'

export interface UploadPhotoParams {
  file: File
  albumId?: string | null
  title?: string | null
  description?: string | null
  takenAt?: string | Date | null
}

export interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  mediaType: MediaType
  title: string
  description: string
  takenAt: string
  isFromExif: boolean
  status: 'idle' | 'uploading' | 'success' | 'error'
  errorMessage?: string
  result?: Photo
}

/** Límites de subida */
export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_VIDEO_DURATION_SECONDS = 30

/**
 * Obtiene la duración de un video en segundos a partir de su objeto File.
 * Devuelve null si no se puede determinar.
 */
export function getVideoDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? video.duration : null)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    video.src = url
  })
}
