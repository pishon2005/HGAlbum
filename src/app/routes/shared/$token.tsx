import { createFileRoute } from '@tanstack/react-router'
import { SharedPage } from '@/pages/SharedPage'

const SharedRouteComponent = () => {
  const { token } = Route.useParams()
  return <SharedPage token={token} />
}

export const Route = createFileRoute('/shared/$token')({
  component: SharedRouteComponent,
})
