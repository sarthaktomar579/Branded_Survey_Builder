import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/dashboard/survey/$id', params: { id: 'new' } })
  }, [navigate])

  return null
}
