export interface Album {
  id: string
  name: string
  description?: string | null
  cover_photo_id?: string | null
  couple_id: string
  created_at: string
  photo_count?: number
  cover_photo_url?: string | null
}

export interface CreateAlbumInput {
  name: string
  description?: string | null
  cover_photo_id?: string | null
  couple_id: string
}

export interface UpdateAlbumInput {
  name?: string
  description?: string | null
  cover_photo_id?: string | null
}
