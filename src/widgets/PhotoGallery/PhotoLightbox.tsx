import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import { useState, type FC } from 'react'
import { useSignedVideoUrl, type PhotoItem } from '@/entities/photo'
import { VideoPlayer } from '@/shared/ui'
import { EmojiReactionBar } from '@/features/photo-rating'

// Slide personalizada para videos: se renderiza con nuestro VideoPlayer
declare module 'yet-another-react-lightbox' {
  interface SlideTypes {
    galleryVideo: {
      type: 'galleryVideo'
      photo: PhotoItem
      title?: string
      description?: string
      thumbnail?: string
    }
  }
}

interface PhotoLightboxProps {
  photos: PhotoItem[]
  index: number
  open: boolean
  onClose: () => void
  /** Oculta la barra de reacciones (p. ej. en la vista pública compartida) */
  readonly?: boolean
}

/** Slide de video: obtiene/refresca la signed URL y renderiza el VideoPlayer */
const VideoSlide: FC<{ photo: PhotoItem }> = ({ photo }) => {
  const { data: videoUrl } = useSignedVideoUrl(photo.storage_path, photo.signedUrl)
  if (!videoUrl) return null
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <VideoPlayer src={videoUrl} className="max-h-[70vh] max-w-full rounded-xl shadow-2xl" />
    </div>
  )
}

export const PhotoLightbox: FC<PhotoLightboxProps> = ({
  photos,
  index,
  open,
  onClose,
  readonly = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(index)
  const currentPhoto = photos[currentIndex]

  const slides = photos.map((photo) => {
    const date = photo.taken_at ? parseISO(photo.taken_at) : null
    const dateLabel =
      date && !Number.isNaN(date.getTime())
        ? format(date, "d 'de' MMMM yyyy", { locale: es })
        : ''
    const description = [photo.description, dateLabel].filter(Boolean).join(' · ')

    if (photo.media_type === 'video') {
      return {
        type: 'galleryVideo' as const,
        photo,
        title: photo.title ?? undefined,
        description,
        thumbnail: photo.signedUrl,
      }
    }

    return {
      src: photo.signedUrl ?? '',
      alt: photo.title || 'Recuerdo',
      title: photo.title ?? undefined,
      description,
      thumbnail: photo.signedUrl,
    }
  })

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails, Captions]}
      zoom={{ scrollToZoom: true }}
      thumbnails={{ position: 'bottom', width: 88, height: 64 }}
      captions={{ descriptionTextAlign: 'center' }}
      on={{ view: ({ index: viewedIndex }) => setCurrentIndex(viewedIndex) }}
      render={{
        slide: ({ slide }) =>
          slide.type === 'galleryVideo' ? <VideoSlide photo={slide.photo} /> : undefined,
        slideFooter: () =>
          !readonly && currentPhoto ? (
            <div className="flex justify-center bg-black/40 px-4 py-1">
              <EmojiReactionBar photoId={currentPhoto.id} />
            </div>
          ) : null,
      }}
    />
  )
}
