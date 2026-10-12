import { useEffect, type FC } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PhotoItem } from '@/entities/photo'

interface LightboxModalProps {
  photo: PhotoItem | null
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

export const LightboxModal: FC<LightboxModalProps> = ({
  photo,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  useEffect(() => {
    if (!photo) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && onNext && hasNext) {
        onNext()
      } else if (e.key === 'ArrowLeft' && onPrev && hasPrev) {
        onPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [photo, onClose, onNext, onPrev, hasNext, hasPrev])

  if (!photo) return null

  const date = parseISO(photo.taken_at)
  const formattedDate = !isNaN(date.getTime())
    ? format(date, "d 'de' MMMM, yyyy · HH:mm", { locale: es })
    : photo.taken_at

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between animate-fadeIn"
      onClick={onClose}
    >
      {/* Barra superior */}
      <div
        className="px-6 py-4 flex items-center justify-between text-white z-10 bg-linear-to-b from-black/60 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
            {photo.media_type === 'video' ? '🎬 Vídeo' : '📸 Foto'}
          </span>
          <span className="text-sm text-gray-300 font-medium">{formattedDate}</span>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer text-xl"
          title="Cerrar (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Contenido principal (Media) */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-8 relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón anterior */}
        {hasPrev && onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 sm:left-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-2xl transition-all cursor-pointer"
            title="Anterior (Flecha izquierda)"
          >
            ‹
          </button>
        )}

        {/* Media (Imagen o Video) */}
        <div className="max-w-5xl max-h-[75vh] flex items-center justify-center overflow-hidden">
          {photo.media_type === 'video' ? (
            <video
              src={photo.signedUrl}
              controls
              autoPlay
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain"
            />
          ) : (
            <img
              src={photo.signedUrl}
              alt={photo.title || 'Recuerdo'}
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain"
            />
          )}
        </div>

        {/* Botón siguiente */}
        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 sm:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-2xl transition-all cursor-pointer"
            title="Siguiente (Flecha derecha)"
          >
            ›
          </button>
        )}
      </div>

      {/* Pie de foto con título y descripción */}
      <div
        className="px-6 py-5 bg-linear-to-t from-black/80 to-transparent text-white z-10 max-w-4xl mx-auto w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.title && (
          <h3 className="text-xl font-bold tracking-tight mb-1 text-white">{photo.title}</h3>
        )}
        {photo.description && (
          <p className="text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {photo.description}
          </p>
        )}
      </div>
    </div>
  )
}
