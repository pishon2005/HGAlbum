import type { FC } from 'react'
import type { Album } from '@/entities/album'
import { AlbumCard } from './AlbumCard'

interface AlbumGridProps {
  albums: Album[]
  onEdit?: (album: Album) => void
  onDelete?: (album: Album) => void
}

export const AlbumGrid: FC<AlbumGridProps> = ({ albums, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          album={album}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
