import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PhotoItem } from '@/entities/photo'

export interface MonthGroup {
  key: string
  label: string
  count: number
  photos: PhotoItem[]
}

/**
 * Agrupa una lista de fotos ordenadas por taken_at en bloques por mes y año.
 */
export function groupPhotosByMonth(photos: PhotoItem[]): MonthGroup[] {
  const groupsMap = new Map<string, { label: string; photos: PhotoItem[] }>()

  for (const photo of photos) {
    const date = parseISO(photo.taken_at)
    const validDate = isNaN(date.getTime()) ? new Date() : date
    const key = format(validDate, 'yyyy-MM')
    const rawMonth = format(validDate, 'MMMM yyyy', { locale: es })
    const label = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { label, photos: [] })
    }
    groupsMap.get(key)!.photos.push(photo)
  }

  // Ordenar grupos descendentemente por YYYY-MM
  const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a))

  return sortedKeys.map((key) => {
    const group = groupsMap.get(key)!
    return {
      key,
      label: group.label,
      count: group.photos.length,
      photos: group.photos,
    }
  })
}
