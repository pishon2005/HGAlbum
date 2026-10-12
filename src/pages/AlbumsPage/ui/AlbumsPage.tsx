import { useState, type FC } from 'react'
import { useAlbums, useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from '@/entities/album'
import type { Album, AlbumFormData } from '@/entities/album'
import {
  AlbumForm,
  AlbumGrid,
  DeleteAlbumDialog,
} from '@/features/album-management'

export const AlbumsPage: FC = () => {
  const { data: albums = [], isLoading, isError, error, refetch } = useAlbumsPageData()
  const createAlbum = useCreateAlbum()
  const updateAlbum = useUpdateAlbum()
  const deleteAlbum = useDeleteAlbum()
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAlbum(null)
    setActionError(null)
  }

  const handleSubmit = async (data: AlbumFormData) => {
    setActionError(null)
    try {
      if (editingAlbum) {
        await updateAlbum.mutateAsync({ id: editingAlbum.id, data })
      } else {
        await createAlbum.mutateAsync(data)
      }
      closeForm()
    } catch (mutationError) {
      setActionError((mutationError as Error).message)
    }
  }

  const handleDelete = async () => {
    if (!deletingAlbum) return
    setActionError(null)
    try {
      await deleteAlbum.mutateAsync(deletingAlbum.id)
      setDeletingAlbum(null)
    } catch (mutationError) {
      setActionError((mutationError as Error).message)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-romantic">
            Colecciones de recuerdos
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-text-primary">Nuestros Álbumes</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Organizad vuestros momentos especiales en colecciones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingAlbum(null)
            setIsFormOpen(true)
          }}
          className="rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          ＋ Crear Álbum
        </button>
      </header>

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {isLoading && <p className="py-12 text-center text-sm text-text-secondary">Cargando álbumes…</p>}
      {isError && (
        <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{(error as Error).message}</p>
          <button type="button" onClick={() => refetch()} className="font-semibold text-red-800 underline">
            Reintentar
          </button>
        </div>
      )}
      {!isLoading && !isError && albums.length === 0 && (
        <div className="mx-auto max-w-xl space-y-5 rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-romantic/10 text-4xl">
            📚
          </span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Vuestros álbumes empiezan aquí</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cread una colección para guardar viajes, celebraciones y pequeños momentos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Crear el primer álbum
          </button>
        </div>
      )}
      {!isLoading && !isError && albums.length > 0 && (
        <AlbumGrid
          albums={albums}
          onEdit={(album) => {
            setEditingAlbum(album)
            setIsFormOpen(true)
          }}
          onDelete={setDeletingAlbum}
        />
      )}

      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingAlbum ? 'Editar álbum' : 'Crear álbum'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeForm}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            {actionError && <p role="alert" className="mb-4 text-sm text-red-600">{actionError}</p>}
            <AlbumForm
              key={editingAlbum?.id ?? 'new-album'}
              initialAlbum={editingAlbum}
              title={editingAlbum ? 'Editar álbum' : 'Crear un álbum'}
              isSubmitting={createAlbum.isPending || updateAlbum.isPending}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
      <DeleteAlbumDialog
        album={deletingAlbum}
        isOpen={Boolean(deletingAlbum)}
        isDeleting={deleteAlbum.isPending}
        onClose={() => setDeletingAlbum(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function useAlbumsPageData() {
  return useAlbums()
}
