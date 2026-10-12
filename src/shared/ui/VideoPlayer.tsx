import type { FC } from 'react'

interface VideoPlayerProps {
  src: string
  /** Miniatura mostrada antes de reproducir */
  poster?: string
  className?: string
  title?: string | null
  description?: string | null
}

/**
 * Reproductor de video simple para clips cortos (hasta ~30 s).
 * Usa la etiqueta nativa <video> sin dependencias externas.
 */
export const VideoPlayer: FC<VideoPlayerProps> = ({
  src,
  poster,
  className,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <video
        src={src}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className={className ?? 'max-h-[70vh] max-w-full rounded-xl shadow-2xl'}
      >
        Tu navegador no soporta la reproducción de video.
      </video>
      {(title || description) && (
        <div className="max-w-2xl text-center">
          {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-300">{description}</p>}
        </div>
      )}
    </div>
  )
}
