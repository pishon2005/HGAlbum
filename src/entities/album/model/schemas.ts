import { z } from 'zod'

export const albumFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del álbum es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  description: z
    .string()
    .max(300, 'La descripción no puede superar los 300 caracteres')
    .optional()
    .or(z.literal('')),
})

export type AlbumFormData = z.infer<typeof albumFormSchema>

export const albumSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  cover_photo_id: z.string().uuid().nullable().optional(),
  couple_id: z.string().uuid(),
  created_at: z.string(),
  photo_count: z.number().optional(),
  cover_photo_url: z.string().nullable().optional(),
})

export const albumsListSchema = z.array(albumSchema)
