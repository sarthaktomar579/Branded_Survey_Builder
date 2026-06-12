import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'

export const Route = createFileRoute('/dashboard/list')({
  component: Dashboard,
})

function Dashboard() {
  const { user, token, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/' })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (token) {
      fetchSurveys()
    }
  }, [token])

  const fetchSurveys = async () => {
    try {
      const res = await fetch('http://localhost:8787/api/surveys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.surveys) setSurveys(data.surveys)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const [toast, setToast] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle) return
    setCreating(true)
    try {
      const res = await fetch('http://localhost:8787/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      })
      const data = await res.json()
      if (data.id) {
        navigate({ to: '/dashboard/survey/$id', params: { id: data.id } })
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create survey')
    } finally {
      setCreating(false)
    }
  }

  if (loading || fetching) return <div className="container mt-8 text-center">Loading...</div>
  if (!user) return null

  return (
    <div className="container animate-fade-in">
      {toast && (
        <div
          className="animate-fade-in"
          style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast}
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted">Welcome, {user.email}</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          Sign out
        </button>
      </div>

      <div className="card mb-8">
        <h3 className="mb-4">Create New Survey</h3>
        <form onSubmit={handleCreate} className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Survey Title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !newTitle}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <h3>Your Surveys</h3>
      {surveys.length === 0 ? (
        <p className="text-muted mt-4">You haven't created any surveys yet.</p>
      ) : (
        <div className="flex-col gap-4 mt-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="card flex justify-between items-center">
              <div>
                <h4
                  style={{
                    color: survey.brand_color !== '#000000' ? survey.brand_color : 'inherit',
                  }}
                >
                  {survey.title}
                </h4>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Created: {new Date(survey.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/dashboard/survey/$id"
                  params={{ id: survey.id }}
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <Link
                  to="/dashboard/responses/$id"
                  params={{ id: survey.id }}
                  className="btn btn-secondary"
                >
                  Responses
                </Link>
                <Link
                  to="/s/$id"
                  params={{ id: survey.id }}
                  className="btn btn-primary"
                  target="_blank"
                >
                  Share
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
