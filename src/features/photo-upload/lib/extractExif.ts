import exifr from 'exifr'

/**
 * Extrae la fecha original de captura de los metadatos EXIF de un archivo de imagen.
 * Si no encuentra metadatos EXIF o no es una imagen, devuelve null.
 */
export async function extractExifDate(file: File): Promise<Date | null> {
  if (!file.type.startsWith('image/')) {
    return null
  }

  try {
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
    })

    if (!data) return null

    const dateVal = data.DateTimeOriginal || data.CreateDate || data.ModifyDate
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      return dateVal
    }
    if (typeof dateVal === 'string') {
      const parsed = new Date(dateVal)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return null
  } catch (error) {
    console.warn('No se pudo extraer metadatos EXIF del archivo:', file.name, error)
    return null
  }
}

/**
 * Convierte un objeto Date a formato 'YYYY-MM-DDTHH:mm' compatible con <input type="datetime-local" />
 */
export function formatToDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
