import { useState, useMemo, type FC } from 'react'
import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/app/providers'
import { useTimeline, groupPhotosByMonth, LightboxModal } from '@/features/timeline'
import type { PhotoItem } from '@/entities/photo'

export const TimelinePage: FC = () => {
  const { couple, profile } = useAuth()
  const { data: photos = [], isLoading, isError, error, refetch } = useTimeline()

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  const hasCouple = Boolean(couple?.id || profile?.couple_id)

  // Agrupar fotos por mes y año (memorizado para React Compiler / rendimiento)
  const monthGroups = useMemo(() => groupPhotosByMonth(photos), [photos])

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null

  const handleOpenLightbox = (photo: PhotoItem) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    if (index !== -1) {
      setSelectedPhotoIndex(index)
    }
  }

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 relative">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-romantic/10 text-accent-romantic text-xs font-semibold uppercase tracking-wider mb-2">
            <span>✨</span> Nuestra Historia
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Línea del Tiempo
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Cada instante juntos, ordenado para revivirlo una y otra vez.
          </p>
        </div>

        {photos.length > 0 && (
          <div className="flex items-center gap-4 text-xs sm:text-sm text-text-secondary font-medium">
            <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
              📸 <strong className="text-text-primary">{photos.length}</strong> recuerdos
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
              🗓️ <strong className="text-text-primary">{monthGroups.length}</strong> meses
            </span>
          </div>
        )}
      </div>

      {/* Si no está vinculado a una pareja */}
      {!hasCouple && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-900">
              Vincula tu pareja para ver y compartir recuerdos
            </h2>
            <p className="text-sm text-amber-700 mt-1">
              Únete con el código de invitación que te compartió tu pareja o comparte el tuyo para comenzar.
            </p>
          </div>
          <Link
            to="/join"
            className="px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Vincularme
          </Link>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="space-y-8 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* Estado de error */}
      {isError && (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-3xl space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-red-900">No se pudieron cargar los recuerdos</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto">
            {(error as Error)?.message || 'Ha ocurrido un error al consultar Supabase.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all cursor-pointer shadow-xs"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado vacío (Sin fotos aún) */}
      {!isLoading && !isError && photos.length === 0 && (
        <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200/60 shadow-xs space-y-6 max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-accent-romantic/10 text-accent-romantic flex items-center justify-center text-4xl mx-auto">
            📖
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">El álbum aún está en blanco</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Aún no habéis subido vuestras primeras fotos. Subid vuestro primer recuerdo juntos para comenzar a llenar esta historia.
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-romantic text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-pink-200 cursor-pointer"
          >
            <span>📷</span>
            <span>Subir nuestro primer recuerdo</span>
          </Link>
        </div>
      )}

      {/* Fotos agrupadas por mes */}
      {!isLoading && !isError && photos.length > 0 && (
        <div className="space-y-12">
          {monthGroups.map((group) => (
            <section key={group.key} className="space-y-4">
              {/* Título de mes con línea decorativa */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  {group.label}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-text-secondary text-xs font-semibold">
                  {group.count}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Grid responsive de fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {group.photos.map((photo) => {
                  const date = parseISO(photo.taken_at)
                  const dayText = !isNaN(date.getTime())
                    ? format(date, "d 'de' MMM", { locale: es })
                    : ''

                  return (
                    <div
                      key={photo.id}
                      onClick={() => handleOpenLightbox(photo)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-2xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Imagen o miniatura de video */}
                      {photo.media_type === 'video' ? (
                        <video
                          src={photo.signedUrl}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          preload="metadata"
                          muted
                        />
                      ) : (
                        <img
                          src={photo.signedUrl}
                          alt={photo.title || 'Recuerdo'}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Insignia de video si aplica */}
                      {photo.media_type === 'video' && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                          <span>🎬</span> Video
                        </span>
                      )}

                      {/* Overlay al pasar el ratón */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 text-white">
                        {photo.title && (
                          <p className="text-xs font-bold line-clamp-1 text-white">{photo.title}</p>
                        )}
                        <p className="text-[11px] text-gray-200 font-medium">{dayText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Botón flotante para subir nuevas fotos (FAB) */}
      <Link
        to="/upload"
        title="Subir nuevo recuerdo"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-14 h-14 rounded-full bg-accent-romantic text-white shadow-xl shadow-pink-300/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl group cursor-pointer"
      >
        <span className="group-hover:rotate-90 transition-transform duration-300">＋</span>
      </Link>

      {/* Modal / Lightbox a pantalla completa */}
      <LightboxModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        hasNext={selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1}
        hasPrev={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
      />
    </div>
  )
}
