import { useState, type FC, type FormEvent } from 'react'
import { albumFormSchema, type AlbumFormData, type Album } from '@/entities/album'

interface AlbumFormProps {
  initialAlbum?: Album | null
  onSubmit: (data: AlbumFormData) => Promise<void> | void
  onCancel: () => void
  isSubmitting?: boolean
  title?: string
}

export const AlbumForm: FC<AlbumFormProps> = ({
  initialAlbum,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
}) => {
  const [name, setName] = useState(initialAlbum?.name || '')
  const [description, setDescription] = useState(initialAlbum?.description || '')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const validation = albumFormSchema.safeParse({ name, description })
    if (!validation.success) {
      const errors: { name?: string; description?: string } = {}
      for (const issue of validation.error.issues) {
        if (issue.path[0] === 'name') errors.name = issue.message
        if (issue.path[0] === 'description') errors.description = issue.message
      }
      setFieldErrors(errors)
      return
    }

    await onSubmit({ name, description })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {title && (
        <h2 className="text-xl font-bold text-text-primary mb-3">{title}</h2>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-primary mb-1">
          Nombre del Álbum <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Viaje a París, Aniversario, Verano 2026..."
          disabled={isSubmitting}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-text-primary transition-all focus:outline-hidden focus:ring-2 ${
            fieldErrors.name
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-accent-romantic/40 focus:border-accent-romantic'
          }`}
        />
        {fieldErrors.name && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-primary mb-1">
          Descripción <span className="text-text-secondary font-normal">(Opcional)</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Añade unas palabras sobre esta colección de recuerdos..."
          disabled={isSubmitting}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-text-primary transition-all focus:outline-hidden focus:ring-2 resize-none ${
            fieldErrors.description
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-accent-romantic/40 focus:border-accent-romantic'
          }`}
        />
        {fieldErrors.description && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-accent-romantic text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-pink-200"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>{initialAlbum ? 'Guardar Cambios' : 'Crear Álbum'}</span>
          )}
        </button>
      </div>
    </form>
  )
}
