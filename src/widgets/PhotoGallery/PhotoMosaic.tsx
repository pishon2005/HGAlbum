import { useMemo, type FC } from 'react'
import { MasonryPhotoAlbum, type Photo } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import type { PhotoItem } from '@/entities/photo'
import type { ReactionSummary } from '@/entities/reaction'
import { PhotoCard } from './PhotoCard'

interface MosaicPhoto extends Photo {
  item: PhotoItem
}

interface PhotoMosaicProps {
  photos: PhotoItem[]
  reactionsByPhoto?: Map<string, ReactionSummary[]>
  onPhotoClick: (photo: PhotoItem) => void
  onMovePhoto?: (photo: PhotoItem) => void
}

export const PhotoMosaic: FC<PhotoMosaicProps> = ({
  photos,
  reactionsByPhoto,
  onPhotoClick,
  onMovePhoto,
}) => {
  const mosaicPhotos = useMemo<MosaicPhoto[]>(
    () =>
      photos.map((photo) => ({
        key: photo.id,
        src: photo.signedUrl ?? '',
        // Dimensiones estimadas; el layout masonry las usa solo para la proporción
        width: 4,
        height: 3,
        item: photo,
      })),
    [photos],
  )

  return (
    <MasonryPhotoAlbum
      photos={mosaicPhotos}
      columns={(containerWidth) => {
        if (containerWidth < 480) return 2
        if (containerWidth < 768) return 3
        if (containerWidth < 1280) return 4
        return 5
      }}
      spacing={12}
      onClick={({ photo }) => onPhotoClick(photo.item)}
      render={{
        photo: ({ onClick }, { photo, width, height }) => (
          <PhotoCard
            photo={photo.item}
            width={width}
            height={height}
            reactions={reactionsByPhoto?.get(photo.item.id)}
            onClick={onClick}
            onMove={onMovePhoto}
          />
        ),
      }}
    />
  )
}
