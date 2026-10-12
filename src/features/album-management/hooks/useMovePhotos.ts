import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePhotoAlbumId } from '@/entities/album'

export const useMovePhotos = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ photoId, albumId }: { photoId: string; albumId: string | null }) =>
      updatePhotoAlbumId(photoId, albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['album'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
