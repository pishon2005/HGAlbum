export type MediaType = 'photo' | 'video'

export interface Photo {
  id: string
  album_id: string | null
  couple_id: string
  uploaded_by: string | null
  storage_path: string
  media_type: MediaType
  title: string | null
  description: string | null
  taken_at: string | null
  created_at: string
}
