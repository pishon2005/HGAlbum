import { useMemo, useState, type FC } from 'react'
import type { PhotoItem } from '@/entities/photo'
import { summarizeReactions, useReactionsBatch, type ReactionSummary } from '@/entities/reaction'
import { useAuth } from '@/app/providers'
import { PhotoLightbox } from './PhotoLightbox'
import { PhotoMosaic } from './PhotoMosaic'

interface PhotoViewerProps {
  photos: PhotoItem[]
  onMovePhoto?: (photo: PhotoItem) => void
  /** Vista de solo lectura: sin reacciones ni acciones (p. ej. página compartida) */
  readonly?: boolean
}

export const PhotoViewer: FC<PhotoViewerProps> = ({ photos, onMovePhoto, readonly = false }) => {
  const { user } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selectedPhotoIndex =
    selectedIndex !== null && selectedIndex < photos.length ? selectedIndex : 0

  const photoIds = useMemo(() => photos.map((photo) => photo.id), [photos])
  const { data: reactions = [] } = useReactionsBatch(readonly ? [] : photoIds)

  const reactionsByPhoto = useMemo(() => {
    const map = new Map<string, ReactionSummary[]>()
    for (const photo of photos) {
      map.set(photo.id, summarizeReactions(reactions, photo.id, user?.id))
    }
    return map
  }, [photos, reactions, user?.id])

  return (
    <>
      <PhotoMosaic
        photos={photos}
        reactionsByPhoto={reactionsByPhoto}
        onPhotoClick={(photo) =>
          setSelectedIndex(photos.findIndex((item) => item.id === photo.id))
        }
        onMovePhoto={onMovePhoto}
      />
      {selectedIndex !== null && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          index={selectedPhotoIndex}
          open
          readonly={readonly}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
