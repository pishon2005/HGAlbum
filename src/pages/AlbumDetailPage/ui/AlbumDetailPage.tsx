import { useState, type FC } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAlbum, useAlbums, useDeleteAlbum, useUpdateAlbum } from '@/entities/album'
import type { Album, AlbumFormData } from '@/entities/album'
import { useMovePhotos } from '@/features/album-management'
import { AlbumForm, DeleteAlbumDialog, MovePhotosDialog } from '@/features/album-management'
import { ShareAlbumDialog } from '@/features/share-album'
import { usePhotos, type PhotoItem } from '@/entities/photo'
import { PhotoViewer } from '@/widgets/PhotoGallery'

interface AlbumDetailPageProps {
  albumId: string
}

export const AlbumDetailPage: FC<AlbumDetailPageProps> = ({ albumId }) => {
  const navigate = useNavigate()
  const { data: album, isLoading: albumLoading, isError: albumError, error: loadError, refetch } = useAlbum(albumId)
  const { data: photos = [], isLoading: photosLoading } = usePhotos({ albumId })
  const { data: albums = [] } = useAlbums()
  const updateAlbum = useUpdateAlbum()
  const deleteAlbum = useDeleteAlbum()
  const movePhotos = useMovePhotos()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [movingPhoto, setMovingPhoto] = useState<PhotoItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleUpdate = async (data: AlbumFormData) => {
    setActionError(null)
    try {
      await updateAlbum.mutateAsync({ id: albumId, data })
      setIsEditing(false)
    } catch (error) {
      setActionError((error as Error).message)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAlbum.mutateAsync(albumId)
      await navigate({ to: '/albums' })
    } catch (error) {
      setActionError((error as Error).message)
    }
  }

  const handleMove = async (albumId: string | null) => {
    if (!movingPhoto) return
    try {
      await movePhotos.mutateAsync({ photoId: movingPhoto.id, albumId })
      setMovingPhoto(null)
    } catch (error) {
      setActionError((error as Error).message)
    }
  }

  if (albumLoading) {
    return <p className="flex-1 py-20 text-center text-text-secondary">Cargando álbum…</p>
  }
  if (albumError) {
    return (
      <div role="alert" className="mx-auto my-16 max-w-xl space-y-4 rounded-2xl bg-red-50 p-6 text-center text-red-700">
        <p>{(loadError as Error).message}</p>
        <button type="button" onClick={() => refetch()} className="underline">Reintentar</button>
      </div>
    )
  }
  if (!album) {
    return (
      <div className="mx-auto my-16 max-w-xl space-y-4 rounded-2xl bg-white p-8 text-center">
        <h1 className="text-xl font-bold">No encontramos este álbum</h1>
        <Link to="/albums" className="text-accent-romantic underline">Volver a álbumes</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/albums" className="text-sm font-semibold text-text-secondary hover:text-accent-romantic">
        ← Todos los álbumes
      </Link>
      <header className="flex flex-col justify-between gap-5 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-romantic">
            {photos.length} {photos.length === 1 ? 'recuerdo' : 'recuerdos'}
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-text-primary">{album.name}</h1>
          {album.description && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{album.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsEditing(true)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
            Editar
          </button>
          <button type="button" onClick={() => setIsSharing(true)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
            🔗 Compartir
          </button>
          <button type="button" onClick={() => setIsDeleting(true)} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            Eliminar
          </button>
          <Link
            to="/upload"
            search={{ albumId: album.id }}
            className="rounded-xl bg-accent-romantic px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            ＋ Subir recuerdos
          </Link>
        </div>
      </header>

      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}
      {photosLoading && <p className="py-10 text-center text-sm text-text-secondary">Cargando recuerdos…</p>}
      {!photosLoading && photos.length === 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center">
          <span className="text-5xl">🌷</span>
          <h2 className="mt-4 text-xl font-bold">Este álbum todavía está vacío</h2>
          <p className="mt-2 text-sm text-text-secondary">Sube fotos o vídeos directamente a esta colección.</p>
          <Link to="/upload" search={{ albumId: album.id }} className="mt-5 inline-flex rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white">
            Subir el primer recuerdo
          </Link>
        </div>
      )}
      {!photosLoading && photos.length > 0 && (
        <PhotoViewer photos={photos} onMovePhoto={setMovingPhoto} />
      )}

      {isEditing && (
        <div role="dialog" aria-modal="true" aria-label="Editar álbum" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsEditing(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <AlbumForm
              key={album.id}
              initialAlbum={album as Album}
              title="Editar álbum"
              isSubmitting={updateAlbum.isPending}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}
      <DeleteAlbumDialog
        album={album as Album}
        isOpen={isDeleting}
        isDeleting={deleteAlbum.isPending}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
      />
      <ShareAlbumDialog
        album={album as Album}
        isOpen={isSharing}
        onClose={() => setIsSharing(false)}
      />
      <MovePhotosDialog
        photo={movingPhoto}
        albums={albums}
        isOpen={Boolean(movingPhoto)}
        isMoving={movePhotos.isPending}
        onClose={() => setMovingPhoto(null)}
        onMove={handleMove}
      />
    </div>
  )
}
