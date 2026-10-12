import { createFileRoute } from '@tanstack/react-router'
import { AlbumDetailPage } from '@/pages/AlbumDetailPage'
import { ProtectedRoute } from '@/shared/ui'

const AlbumDetailRouteComponent = () => {
  const { albumId } = Route.useParams()
  return (
    <ProtectedRoute>
      <AlbumDetailPage albumId={albumId} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/albums/$albumId')({
  component: AlbumDetailRouteComponent,
})
