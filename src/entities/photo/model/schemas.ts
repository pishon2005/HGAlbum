import { z } from 'zod'

export const mediaTypeSchema = z.enum(['photo', 'video'])

export const photoSchema = z.object({
  id: z.string().uuid(),
  album_id: z.string().uuid().nullable().optional(),
  couple_id: z.string().uuid(),
  uploaded_by: z.string().uuid().nullable().optional(),
  storage_path: z.string().min(1),
  media_type: mediaTypeSchema,
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  taken_at: z.string(),
  created_at: z.string(),
  signedUrl: z.string().optional(),
})

export const photosListSchema = z.array(photoSchema)

export type PhotoItem = z.infer<typeof photoSchema>
