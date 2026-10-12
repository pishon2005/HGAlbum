import type { FC } from 'react'
import type { Album } from '@/entities/album'

interface DeleteAlbumDialogProps {
  album: Album | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  isDeleting?: boolean
}

export const DeleteAlbumDialog: FC<DeleteAlbumDialogProps> = ({
  album,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !album) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-5 border border-gray-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl mx-auto">
          🗑️
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-text-primary">
            ¿Eliminar el álbum "{album.name}"?
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Esta acción eliminará el álbum. Las fotos guardadas en él no se borrarán de vuestra cuenta y seguirán disponibles en la línea del tiempo.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-red-200"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <span>Eliminar Álbum</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
