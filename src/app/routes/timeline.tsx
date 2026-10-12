import { createFileRoute } from '@tanstack/react-router'
import { TimelinePage } from '@/pages/TimelinePage'
import { ProtectedRoute } from '@/shared/ui'

export const Route = createFileRoute('/timeline')({
  component: () => (
    <ProtectedRoute>
      <TimelinePage />
    </ProtectedRoute>
  ),
})
