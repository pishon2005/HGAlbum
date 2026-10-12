import { useState, useRef, type FC, type ChangeEvent, type DragEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/app/providers'
import { useAlbums } from '@/entities/album'
import { useUploadPhoto, extractExifDate, formatToDateTimeLocal, type UploadQueueItem, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, MAX_VIDEO_DURATION_SECONDS, getVideoDurationSeconds } from '@/features/photo-upload'

export const UploadPage: FC = () => {
  const { couple, profile } = useAuth()
  const { uploadPhoto, isUploading } = useUploadPhoto()
  const navigate = useNavigate()
  const { albumId: preselectedAlbumId } = useSearch({ from: '/upload' })
  const { data: albums = [] } = useAlbums()
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(preselectedAlbumId ?? '')

  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [overallProgress, setOverallProgress] = useState<{ total: number; done: number } | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCouple = Boolean(couple?.id || profile?.couple_id)

  const processFiles = async (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue
      }

      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo'

      // Validar tamaño máximo
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newItems.push({
          id,
          file,
          previewUrl,
          mediaType,
          title: '',
          description: '',
          takenAt: formatToDateTimeLocal(new Date()),
          isFromExif: false,
          status: 'error',
          errorMessage: `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        })
        continue
      }

      // Validar duración máxima de video
      if (mediaType === 'video') {
        const duration = await getVideoDurationSeconds(file)
        if (duration !== null && duration > MAX_VIDEO_DURATION_SECONDS) {
          newItems.push({
            id,
            file,
            previewUrl,
            mediaType,
            title: '',
            description: '',
            takenAt: formatToDateTimeLocal(new Date()),
            isFromExif: false,
            status: 'error',
            errorMessage: `El video dura ${Math.round(duration)} s y el máximo permitido es ${MAX_VIDEO_DURATION_SECONDS} s.`,
          })
          continue
        }
      }

      // Extraer fecha EXIF si está disponible
      const exifDate = await extractExifDate(file)
      const defaultDate = exifDate || new Date(file.lastModified || Date.now())
      const formattedDate = formatToDateTimeLocal(defaultDate)

      newItems.push({
        id,
        file,
        previewUrl,
        mediaType,
        title: '',
        description: '',
        takenAt: formattedDate,
        isFromExif: Boolean(exifDate),
        status: 'idle',
      })
    }

    setQueue((prev) => [...prev, ...newItems])
    setUploadSuccess(false)
  }

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files)
    }
  }

  const handleUpdateItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
  }

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleUploadAll = async () => {
    const idleItems = queue.filter((item) => item.status === 'idle' || item.status === 'error')
    if (idleItems.length === 0) return

    setOverallProgress({ total: idleItems.length, done: 0 })
    let completedCount = 0

    for (const item of idleItems) {
      handleUpdateItem(item.id, { status: 'uploading', errorMessage: undefined })

      try {
        const result = await uploadPhoto({
          file: item.file,
          albumId: selectedAlbumId || null,
          title: item.title,
          description: item.description,
          takenAt: new Date(item.takenAt),
        })

        handleUpdateItem(item.id, { status: 'success', result })
        completedCount++
        setOverallProgress({ total: idleItems.length, done: completedCount })
      } catch (err) {
        const errorMsg = (err as Error).message || 'Error en la subida'
        handleUpdateItem(item.id, { status: 'error', errorMessage: errorMsg })
      }
    }

    if (completedCount === idleItems.length) {
      setUploadSuccess(true)
    }
  }

  const handleClearCompleted = () => {
    setQueue((prev) => {
      const remaining = prev.filter((item) => item.status !== 'success')
      prev.forEach((item) => {
        if (item.status === 'success') {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
      return remaining
    })
    setUploadSuccess(false)
    setOverallProgress(null)
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary">Subir Recuerdos</h1>
        <p className="text-text-secondary text-sm mt-1">
          Añade fotos y videos para mantener vivo cada momento especial de vuestra historia.
        </p>
      </div>

      {/* Advertencia si no está vinculado a una pareja */}
      {!hasCouple && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-900">
              Pareja requerida para subir archivos
            </h2>
            <p className="text-sm text-amber-700 mt-1">
              Para asegurar la privacidad de vuestro álbum, debes haberte registrado o unido a una pareja antes de subir fotos.
            </p>
          </div>
          <Link
            to="/join"
            className="px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Vincularme con Código
          </Link>
        </div>
      )}

      {/* Zona de Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging
            ? 'border-accent-romantic bg-accent-romantic/10 scale-[1.01]'
            : 'border-gray-300 hover:border-accent-romantic/60 bg-white hover:bg-pink-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!hasCouple || isUploading}
        />
        <div className="w-16 h-16 rounded-2xl bg-accent-romantic/10 text-accent-romantic flex items-center justify-center text-3xl mb-4">
          📷
        </div>
        <p className="text-lg font-bold text-text-primary">
          Arrastra fotos o vídeos aquí o haz clic para explorar
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {`Formatos: JPG, PNG, HEIC, MP4, MOV · Máx. ${MAX_FILE_SIZE_MB} MB por archivo · Videos de hasta ${MAX_VIDEO_DURATION_SECONDS} s · Detección automática de fecha EXIF.`}
        </p>
      </div>

      {/* Selector de álbum */}
      {albums.length > 0 && (
        <div className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-4">
          <label htmlFor="album-select" className="text-xs font-semibold text-text-secondary">
            Álbum destino
          </label>
          <select
            id="album-select"
            value={selectedAlbumId}
            onChange={(event) => setSelectedAlbumId(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
          >
            <option value="">Sin álbum</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Banner de éxito */}
      {uploadSuccess && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-bold text-green-900">¡Todos los recuerdos han sido subidos con éxito!</p>
              <p className="text-sm text-green-700">Se han guardado de forma privada y segura en vuestro álbum.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCompleted}
              className="px-4 py-2 bg-white border border-green-300 text-green-800 rounded-lg text-sm font-medium hover:bg-green-100/50 cursor-pointer"
            >
              Subir más
            </button>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-4 py-2 bg-accent-romantic text-white rounded-lg text-sm font-semibold hover:opacity-90 cursor-pointer"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      )}

      {/* Cola de archivos seleccionados */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">
              Archivos para subir ({queue.length})
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQueue([])}
                disabled={isUploading}
                className="text-xs text-text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                Limpiar lista
              </button>
              <button
                onClick={handleUploadAll}
                disabled={!hasCouple || isUploading || queue.every((i) => i.status === 'success')}
                className="px-5 py-2.5 bg-accent-romantic text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-pink-200"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>
                      Subiendo ({overallProgress?.done ?? 0}/{overallProgress?.total ?? queue.length})...
                    </span>
                  </>
                ) : (
                  <span>Subir {queue.filter((i) => i.status !== 'success').length} Recuerdos</span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row gap-5 ${
                  item.status === 'success'
                    ? 'border-green-200 bg-green-50/20'
                    : item.status === 'error'
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Vista previa */}
                <div className="w-full md:w-48 h-36 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {item.mediaType === 'photo' ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  )}

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs uppercase">
                    {item.mediaType === 'video' ? '🎬 Vídeo' : '📸 Foto'}
                  </span>

                  {item.status === 'success' && (
                    <div className="absolute inset-0 bg-green-900/40 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">✓</span>
                    </div>
                  )}

                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Formulario editable por archivo */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-mono text-text-secondary truncate max-w-xs sm:max-w-md">
                      {item.file.name} ({(item.file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={item.status === 'uploading'}
                      className="text-text-secondary hover:text-red-500 text-xs px-2 py-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
                      title="Eliminar de la lista"
                    >
                      ✕ Quitar
                    </button>
                  </div>

                  {item.errorMessage && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      ⚠️ {item.errorMessage}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Campo de fecha tomada */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-text-primary">
                          Fecha del recuerdo
                        </label>
                        {item.isFromExif ? (
                          <span className="text-[11px] text-accent-romantic font-medium">
                            🏷️ EXIF Cámara
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-secondary">
                            📅 Por defecto
                          </span>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        value={item.takenAt}
                        onChange={(e) => handleUpdateItem(item.id, { takenAt: e.target.value })}
                        disabled={item.status === 'uploading' || item.status === 'success'}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
                      />
                    </div>

                    {/* Campo de título */}
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Título <span className="text-text-secondary font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Atardecer en la playa..."
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                        disabled={item.status === 'uploading' || item.status === 'success'}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40"
                      />
                    </div>
                  </div>

                  {/* Campo de descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Descripción <span className="text-text-secondary font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Escribe alguna anécdota o sentimiento de este momento..."
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                      disabled={item.status === 'uploading' || item.status === 'success'}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-romantic/40 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
