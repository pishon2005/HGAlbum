import type { FC } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import type { PhotoItem } from '@/entities/photo'
import { PhotoViewer } from '@/widgets/PhotoGallery'

interface SharedPageProps {
  token: string
}

interface SharedAlbumContent {
  success: boolean
  error?: string
  album?: {
    id: string
    name: string
    description: string | null
    created_at: string
  }
  photos?: Omit<PhotoItem, 'signedUrl'>[]
}

async function fetchSharedAlbum(token: string) {
  const { data, error } = await supabase.rpc('get_shared_album_content', {
    p_token: token,
  })

  if (error) throw new Error(`Error al validar el enlace: ${error.message}`)

  const content = data as SharedAlbumContent
  if (!content.success || !content.album) {
    throw new Error(content.error ?? 'Enlace no válido o caducado')
  }

  const photos = content.photos ?? []
  let signedUrls: { signedUrl: string }[] = []
  if (photos.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from('album-media')
      .createSignedUrls(photos.map((photo) => photo.storage_path), 3600)
    if (signError) {
      throw new Error(`Error al generar enlaces seguros: ${signError.message}`)
    }
    signedUrls = (signed ?? []) as { signedUrl: string }[]
  }

  const photosWithUrls: PhotoItem[] = photos.map((photo, index) => ({
    ...photo,
    signedUrl: signedUrls[index]?.signedUrl ?? '',
  }))

  return { album: content.album, photos: photosWithUrls }
}

export const SharedPage: FC<SharedPageProps> = ({ token }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shared-album', token],
    queryFn: () => fetchSharedAlbum(token),
    retry: false,
    staleTime: 1000 * 60 * 30,
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-accent-romantic/30 border-t-accent-romantic" />
        <p className="text-sm text-text-secondary">Cargando álbum compartido…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <span className="text-5xl">🔒</span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Enlace no disponible</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {(error as Error)?.message ??
                'Este enlace de compartir no es válido o ha caducado.'}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Ir a HGAlbum
          </Link>
        </div>
      </div>
    )
  }

  const { album, photos } = data
  const createdDate = parseISO(album.created_at)
  const createdLabel = !Number.isNaN(createdDate.getTime())
    ? format(createdDate, "d 'de' MMMM, yyyy", { locale: es })
    : ''

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Banner de procedencia */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-accent-romantic/30 bg-accent-romantic/10 px-5 py-3 sm:flex-row">
        <p className="text-sm font-medium text-text-primary">
          💌 Compartido desde <strong>HGAlbum</strong> — un álbum privado para parejas
        </p>
        <Link
          to="/"
          className="rounded-xl bg-accent-romantic px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Crea tu propio álbum
        </Link>
      </div>

      <header className="border-b border-gray-200/80 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-romantic">
          Álbum compartido · {photos.length} {photos.length === 1 ? 'recuerdo' : 'recuerdos'}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-text-primary">{album.name}</h1>
        {album.description && (
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">{album.description}</p>
        )}
        {createdLabel && (
          <p className="mt-1 text-xs text-gray-400">Creado el {createdLabel}</p>
        )}
      </header>

      {photos.length === 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center">
          <span className="text-5xl">🌷</span>
          <h2 className="mt-4 text-xl font-bold">Este álbum todavía está vacío</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Cuando sus dueños suban recuerdos, aparecerán aquí.
          </p>
        </div>
      )}
      {photos.length > 0 && <PhotoViewer photos={photos} readonly />}
    </div>
  )
}
