import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { useAuth } from '../AuthContext'

export const Route = createFileRoute('/')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate({ to: '/dashboard' })
    return null
  }

  if (authLoading) {
    return <div className="container text-center mt-8">Loading...</div>
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await login(email)
      navigate({ to: '/dashboard' })
    } catch (err) {
      console.error(err)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="container flex-col items-center justify-center animate-fade-in"
      style={{ minHeight: '100vh', display: 'flex' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-8">
          <h1 style={{ marginBottom: '0.5rem' }}>DoCoDeGo</h1>
          <p className="text-muted">Forma</p>
        </div>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
