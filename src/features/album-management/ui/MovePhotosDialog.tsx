import type { FC } from 'react'
import type { Album } from '@/entities/album'
import type { PhotoItem } from '@/entities/photo'

interface MovePhotosDialogProps {
  photo: PhotoItem | null
  albums: Album[]
  isOpen: boolean
  isMoving?: boolean
  onClose: () => void
  onMove: (albumId: string | null) => Promise<void> | void
}

export const MovePhotosDialog: FC<MovePhotosDialogProps> = ({
  photo,
  albums,
  isOpen,
  isMoving = false,
  onClose,
  onMove,
}) => {
  if (!isOpen || !photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-photo-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="move-photo-title" className="text-xl font-bold text-text-primary">
            Mover recuerdo
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Elige el álbum de destino para este recuerdo.
          </p>
        </div>
        <div className="space-y-2">
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              disabled={isMoving || album.id === photo.album_id}
              onClick={() => onMove(album.id)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-text-primary hover:border-accent-romantic hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📖 {album.name}
            </button>
          ))}
          {photo.album_id && (
            <button
              type="button"
              disabled={isMoving}
              onClick={() => onMove(null)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-text-secondary hover:border-accent-romantic hover:bg-pink-50 disabled:opacity-50"
            >
              Quitar del álbum
            </button>
          )}
          {albums.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-text-secondary">
              Crea un álbum antes de mover recuerdos.
            </p>
          )}
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isMoving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
