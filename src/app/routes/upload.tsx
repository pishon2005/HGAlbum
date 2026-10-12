import { createFileRoute } from '@tanstack/react-router'
import { UploadPage } from '@/pages/UploadPage'
import { ProtectedRoute } from '@/shared/ui'

export const Route = createFileRoute('/upload')({
  validateSearch: (search: Record<string, unknown>): { albumId?: string } => ({
    albumId: typeof search.albumId === 'string' ? search.albumId : undefined,
  }),
  component: () => (
    <ProtectedRoute>
      <UploadPage />
    </ProtectedRoute>
  ),
})
