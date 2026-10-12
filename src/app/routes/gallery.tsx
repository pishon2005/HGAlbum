import { createFileRoute } from '@tanstack/react-router'
import { GalleryPage } from '@/pages/GalleryPage'
import { ProtectedRoute } from '@/shared/ui'

export const Route = createFileRoute('/gallery')({
  component: () => (
    <ProtectedRoute>
      <GalleryPage />
    </ProtectedRoute>
  ),
})
