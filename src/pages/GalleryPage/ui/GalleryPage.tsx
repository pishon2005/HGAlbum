import { useState, type FC } from 'react'
import { Link } from '@tanstack/react-router'
import { useAlbums } from '@/entities/album'
import { usePhotos } from '@/entities/photo'
import type { MediaType } from '@/entities/photo'
import { PhotoViewer } from '@/widgets/PhotoGallery'

type MediaFilter = MediaType | 'all'

export const GalleryPage: FC = () => {
  const [albumFilter, setAlbumFilter] = useState<string>('all')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: albums = [] } = useAlbums()
  const { data: photos = [], isLoading, isError, error, refetch } = usePhotos({
    albumId: albumFilter === 'all' ? undefined : albumFilter,
    mediaType: mediaFilter,
    dateRange: {
      from: dateFrom || undefined,
      to: dateTo || undefined,
    },
  })

  const hasActiveFilters = albumFilter !== 'all' || mediaFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const clearFilters = () => {
    setAlbumFilter('all')
    setMediaFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-romantic">
            Galería
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-text-primary">Todos los recuerdos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {photos.length} {photos.length === 1 ? 'recuerdo' : 'recuerdos'} en vuestra historia.
          </p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          ＋ Subir recuerdos
        </Link>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-album" className="text-xs font-semibold text-text-secondary">
            Álbum
          </label>
          <select
            id="filter-album"
            value={albumFilter}
            onChange={(event) => setAlbumFilter(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
          >
            <option value="all">Todos los álbumes</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-type" className="text-xs font-semibold text-text-secondary">
            Tipo
          </label>
          <select
            id="filter-type"
            value={mediaFilter}
            onChange={(event) => setMediaFilter(event.target.value as MediaFilter)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
          >
            <option value="all">Fotos y videos</option>
            <option value="photo">Solo fotos</option>
            <option value="video">Solo videos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-from" className="text-xs font-semibold text-text-secondary">
            Desde
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-to" className="text-xs font-semibold text-text-secondary">
            Hasta
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-text-secondary">Cargando recuerdos…</p>
      )}
      {isError && (
        <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}
      {!isLoading && !isError && photos.length === 0 && (
        <div className="mx-auto max-w-xl space-y-5 rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <span className="text-5xl">🖼️</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {hasActiveFilters ? 'Sin resultados con estos filtros' : 'Aún no hay recuerdos'}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {hasActiveFilters
                ? 'Prueba a ajustar los filtros o limpiarlos.'
                : 'Subid vuestras fotos y videos para empezar a llenar la galería.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl bg-accent-romantic px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      {!isLoading && !isError && photos.length > 0 && <PhotoViewer photos={photos} />}
    </div>
  )
}
