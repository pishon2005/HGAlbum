import { useState, type FC, type MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Album } from '@/entities/album'

interface AlbumCardProps {
  album: Album
  onEdit?: (album: Album) => void
  onDelete?: (album: Album) => void
}

export const AlbumCard: FC<AlbumCardProps> = ({ album, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const date = parseISO(album.created_at)
  const formattedDate = !isNaN(date.getTime())
    ? format(date, "d 'de' MMMM, yyyy", { locale: es })
    : 'Fecha no disponible'

  const handleMenuToggle = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const handleEditClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    onEdit?.(album)
  }

  const handleDeleteClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    onDelete?.(album)
  }

  return (
    <Link
      to="/albums/$albumId"
      params={{ albumId: album.id }}
      className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
    >
      {/* Portada */}
      <div className="relative aspect-4/3 w-full bg-linear-to-br from-pink-50 via-purple-50 to-indigo-50 overflow-hidden flex items-center justify-center">
        {album.cover_photo_url ? (
          <img
            src={album.cover_photo_url}
            alt={album.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-center p-6 space-y-2 select-none">
            <span className="text-5xl block animate-bounce-subtle">📖</span>
            <span className="text-xs font-medium text-text-secondary">Sin fotos aún</span>
          </div>
        )}

        {/* Insignia de conteo */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-text-primary text-xs font-semibold shadow-2xs flex items-center gap-1.5">
          <span>📷</span>
          <span>{album.photo_count ?? 0} {album.photo_count === 1 ? 'recuerdo' : 'recuerdos'}</span>
        </div>

        {/* Botón de opciones */}
        {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3">
            <button
              onClick={handleMenuToggle}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-text-primary backdrop-blur-xs flex items-center justify-center shadow-2xs transition-all cursor-pointer text-sm font-bold"
              title="Opciones del álbum"
            >
              ⋮
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    onClick={handleEditClick}
                    className="w-full text-left px-3 py-2 text-text-primary hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span>✏️</span> Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🗑️</span> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-2">
        <h3 className="font-bold text-lg text-text-primary group-hover:text-accent-romantic transition-colors line-clamp-1">
          {album.name}
        </h3>
        {album.description && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {album.description}
          </p>
        )}
        <p className="text-[11px] text-gray-400 font-medium pt-1">
          Creado el {formattedDate}
        </p>
      </div>
    </Link>
  )
}
