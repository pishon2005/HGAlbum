import { createFileRoute } from '@tanstack/react-router'
import { AlbumsPage } from '@/pages/AlbumsPage'
import { ProtectedRoute } from '@/shared/ui'

export const Route = createFileRoute('/albums/')({
  component: () => (
    <ProtectedRoute>
      <AlbumsPage />
    </ProtectedRoute>
  ),
})
