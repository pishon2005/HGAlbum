import { supabase } from '@/shared/lib/supabase'
import type { Album, CreateAlbumInput, UpdateAlbumInput } from '../model/types'
import { albumSchema, albumsListSchema } from '../model/schemas'

/**
 * Obtiene todos los álbumes de una pareja, calculando el número de fotos
 * y generando la URL firmada de la portada.
 */
export async function getAlbums(coupleId: string): Promise<Album[]> {
  const { data: albumsData, error: albumsError } = await supabase
    .from('albums')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })

  if (albumsError) {
    throw new Error(`Error al consultar álbumes: ${albumsError.message}`)
  }

  if (!albumsData || albumsData.length === 0) {
    return []
  }

  // Obtener todas las fotos de la pareja para calcular conteos y portadas
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .select('id, album_id, storage_path, taken_at')
    .eq('couple_id', coupleId)
    .order('taken_at', { ascending: false })

  if (photosError) {
    throw new Error(`Error al consultar las fotos de los álbumes: ${photosError.message}`)
  }

  const photos = photosData ?? []

  // Mapear fotos por álbum
  const photosByAlbum = new Map<string, typeof photos>()
  for (const photo of photos) {
    if (photo.album_id) {
      if (!photosByAlbum.has(photo.album_id)) {
        photosByAlbum.set(photo.album_id, [])
      }
      photosByAlbum.get(photo.album_id)!.push(photo)
    }
  }

  // Determinar rutas de portada a firmar
  const coverPathsToFetch: { albumId: string; path: string }[] = []
  for (const album of albumsData) {
    let coverPath: string | null = null
    if (album.cover_photo_id) {
      const explicitCover = photos.find((p) => p.id === album.cover_photo_id)
      if (explicitCover) coverPath = explicitCover.storage_path
    }
    // Si no tiene portada explícita, usar la foto más reciente del álbum
    if (!coverPath) {
      const albumPhotos = photosByAlbum.get(album.id)
      if (albumPhotos && albumPhotos.length > 0) {
        coverPath = albumPhotos[0].storage_path
      }
    }
    if (coverPath) {
      coverPathsToFetch.push({ albumId: album.id, path: coverPath })
    }
  }

  // Generar URLs firmadas para las portadas
  const signedMap = new Map<string, string>()
  if (coverPathsToFetch.length > 0) {
    const paths = coverPathsToFetch.map((c) => c.path)
    const { data: signedUrls, error: signedError } = await supabase.storage
      .from('album-media')
      .createSignedUrls(paths, 3600)

    if (signedError) {
      throw new Error(`Error al firmar las portadas de los álbumes: ${signedError.message}`)
    }
    signedUrls?.forEach((signed, index) => {
      if (signed?.signedUrl) {
        signedMap.set(coverPathsToFetch[index].albumId, signed.signedUrl)
      }
    })
  }

  const enrichedAlbums = albumsData.map((album) => {
    const count = photosByAlbum.get(album.id)?.length || 0
    const coverUrl = signedMap.get(album.id) || null
    return {
      ...album,
      photo_count: count,
      cover_photo_url: coverUrl,
    }
  })

  return albumsListSchema.parse(enrichedAlbums)
}

/**
 * Obtiene un álbum específico por su ID.
 */
export async function getAlbumById(id: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al obtener el álbum: ${error.message}`)
  }

  if (!data) return null

  // Obtener conteo y foto más reciente para portada
  const { data: albumPhotos, error: photosError } = await supabase
    .from('photos')
    .select('id, storage_path')
    .eq('album_id', id)
    .order('taken_at', { ascending: false })

  if (photosError) {
    throw new Error(`Error al consultar las fotos del álbum: ${photosError.message}`)
  }

  const photoCount = albumPhotos.length
  let coverUrl: string | null = null

  const targetCoverPhoto =
    albumPhotos.find((p) => p.id === data.cover_photo_id) || albumPhotos[0]

  if (targetCoverPhoto) {
    const { data: signed, error: signedError } = await supabase.storage
      .from('album-media')
      .createSignedUrl(targetCoverPhoto.storage_path, 3600)
    if (signedError) {
      throw new Error(`Error al firmar la portada del álbum: ${signedError.message}`)
    }
    coverUrl = signed?.signedUrl || null
  }

  const enriched = {
    ...data,
    photo_count: photoCount,
    cover_photo_url: coverUrl,
  }

  return albumSchema.parse(enriched)
}

/**
 * Crea un nuevo álbum en Supabase.
 */
export async function createAlbum(data: CreateAlbumInput): Promise<Album> {
  const { data: created, error } = await supabase
    .from('albums')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      cover_photo_id: data.cover_photo_id || null,
      couple_id: data.couple_id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear el álbum: ${error.message}`)
  }

  return {
    ...created,
    photo_count: 0,
    cover_photo_url: null,
  }
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(id: string, data: UpdateAlbumInput): Promise<Album> {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  if (data.cover_photo_id !== undefined) updates.cover_photo_id = data.cover_photo_id

  const { data: updated, error } = await supabase
    .from('albums')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al actualizar el álbum: ${error.message}`)
  }

  return updated as Album
}

/**
 * Elimina un álbum por su ID.
 */
export async function deleteAlbum(id: string): Promise<void> {
  const { error } = await supabase.from('albums').delete().eq('id', id)
  if (error) {
    throw new Error(`Error al eliminar el álbum: ${error.message}`)
  }
}

/**
 * Mueve o asigna una foto a un álbum (o la desvincula si albumId es null).
 */
export async function updatePhotoAlbumId(photoId: string, albumId: string | null): Promise<void> {
  const { error } = await supabase
    .from('photos')
    .update({ album_id: albumId })
    .eq('id', photoId)

  if (error) {
    throw new Error(`Error al mover la foto: ${error.message}`)
  }
}
