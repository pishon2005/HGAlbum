import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FC, MouseEvent, MouseEventHandler } from 'react'
import type { PhotoItem } from '@/entities/photo'
import type { ReactionSummary } from '@/entities/reaction'
import { ReactionBubble } from '@/features/photo-rating'

interface PhotoCardProps {
  photo: PhotoItem
  width: number
  height: number
  reactions?: ReactionSummary[]
  onClick?: MouseEventHandler
  onMove?: (photo: PhotoItem) => void
}

export const PhotoCard: FC<PhotoCardProps> = ({ photo, width, height, reactions, onClick, onMove }) => {
  const date = photo.taken_at ? parseISO(photo.taken_at) : null
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? format(date, 'd MMM yyyy', { locale: es })
    : ''

  const handleMove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onMove?.(photo)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.(event as unknown as MouseEvent<HTMLDivElement>)
        }
      }}
      style={{ width, height }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm focus-visible:outline-2 focus-visible:outline-accent-romantic"
    >
      {photo.media_type === 'video' ? (
        <video
          src={photo.signedUrl}
          preload="metadata"
          muted
          className="block h-full w-full object-cover"
        />
      ) : (
        <img
          src={photo.signedUrl}
          alt={photo.title || 'Recuerdo'}
          loading="lazy"
          className="block h-full w-full object-cover"
        />
      )}
      {photo.media_type === 'video' && (
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
          ▶ Video
        </span>
      )}
      {onMove && (
        <button
          type="button"
          onClick={handleMove}
          aria-label="Mover a otro álbum"
          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-text-primary opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          ⋮
        </button>
      )}
      {reactions && reactions.length > 0 && (
        <div className="absolute bottom-3 left-3">
          <ReactionBubble reactions={reactions} maxVisible={3} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-4 pt-10 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {photo.title && <p className="truncate text-sm font-semibold">{photo.title}</p>}
        {dateLabel && <p className="mt-1 text-xs text-white/80">{dateLabel}</p>}
      </div>
    </div>
  )
}
