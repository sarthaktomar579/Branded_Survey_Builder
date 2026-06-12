import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'

export const Route = createFileRoute('/dashboard/survey/$id')({
  component: SurveyBuilder,
})

function SurveyBuilder() {
  const { id } = Route.useParams()
  const { token, loading, user, logout } = useAuth()
  const navigate = useNavigate()

  const [survey, setSurvey] = useState<any>(
    id === 'new'
      ? {
          title: 'Untitled Survey',
          brand_color: '#3b82f6',
          brand_logo_url: '',
        }
      : null,
  )
  const [questions, setQuestions] = useState<any[]>([])
  const [fetching, setFetching] = useState(id !== 'new')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/' })
  }, [user, loading, navigate])

  useEffect(() => {
    if (token) {
      if (id === 'new') {
        setFetching(false)
      } else {
        fetchSurvey()
      }
    }
  }, [token, id])

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`http://localhost:8787/api/surveys/${id}`)
      const data = await res.json()
      if (data.survey) {
        setSurvey(data.survey)
        setQuestions(data.questions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (id === 'new') {
        const res = await fetch(`http://localhost:8787/api/surveys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: survey.title,
            brand_color: survey.brand_color,
            brand_logo_url: survey.brand_logo_url,
            questions,
          }),
        })
        const data = await res.json()
        alert('Survey created successfully!')
        navigate({ to: '/dashboard/survey/$id', params: { id: data.id } })
      } else {
        await fetch(`http://localhost:8787/api/surveys/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: survey.title,
            brand_color: survey.brand_color,
            brand_logo_url: survey.brand_logo_url,
            questions,
          }),
        })
        alert('Survey saved successfully!')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save survey')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = (type: string) => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        type,
        title: 'New Question',
        options: type === 'multiple_choice' ? ['Option 1'] : [],
      },
    ])
  }

  const updateQuestion = (index: number, key: string, value: any) => {
    const newQ = [...questions]
    newQ[index] = { ...newQ[index], [key]: value }
    setQuestions(newQ)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return
    const newQ = [...questions]
    const swap = newQ[index + (direction === 'up' ? -1 : 1)]
    newQ[index + (direction === 'up' ? -1 : 1)] = newQ[index]
    newQ[index] = swap
    setQuestions(newQ)
  }

  if (loading || fetching) return <div className="container mt-8 text-center">Loading...</div>
  if (!survey) return <div className="container mt-8 text-center">Survey not found</div>

  return (
    <div
      className="animate-fade-in"
      style={
        {
          '--brand-primary': survey.brand_color,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        } as any
      }
    >
      {/* Full width header for extreme corners */}
      <header className="flex justify-between items-center" style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex gap-4 items-center">
          <div style={{ fontWeight: 800, fontSize: '1.75rem', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.05em' }}>Forma</div>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            to="/dashboard/list"
            className="btn btn-primary"
          >
            My Surveys
          </Link>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Survey'}
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <div className="container" style={{ flex: 1, paddingTop: '2rem' }}>
        <h2 className="mb-4">Builder</h2>
        <div className="card mb-8">
          <h3>Survey Settings</h3>
          <div className="flex-col gap-4 mt-4">
            <div>
              <label>Survey Title</label>
              <input
                value={survey.title}
                onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label>Brand Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={survey.brand_color || '#000000'}
                    onChange={(e) => setSurvey({ ...survey, brand_color: e.target.value })}
                    style={{ width: '50px', padding: '0.2rem', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={survey.brand_color || '#000000'}
                    onChange={(e) => setSurvey({ ...survey, brand_color: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label>Brand Logo URL (Optional)</label>
                <input
                  value={survey.brand_logo_url || ''}
                  onChange={(e) => setSurvey({ ...survey, brand_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>
        </div>

        <h3>Questions</h3>
        <div className="flex gap-2 mt-4 mb-8">
          <button className="btn btn-secondary" onClick={() => addQuestion('short_text')}>
            + Short Text
          </button>
          <button className="btn btn-secondary" onClick={() => addQuestion('multiple_choice')}>
            + Multiple Choice
          </button>
          <button className="btn btn-secondary" onClick={() => addQuestion('rating')}>
            + Rating (1-5)
          </button>
        </div>

        <div className="flex-col gap-4">
          {questions.map((q, index) => (
            <div key={q.id} className="card flex-col gap-4" style={{ position: 'relative' }}>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontWeight: 600 }}>
                  {index + 1}. {q.type.replace('_', ' ').toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                  >
                    &uarr;
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => moveQuestion(index, 'down')}
                    disabled={index === questions.length - 1}
                  >
                    &darr;
                  </button>
                  <button className="btn btn-danger" onClick={() => removeQuestion(index)}>
                    X
                  </button>
                </div>
              </div>

              <div>
                <label>Question Title</label>
                <input
                  value={q.title}
                  onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                />
              </div>

              {q.type === 'multiple_choice' && (
                <div>
                  <label>Options</label>
                  <div className="flex-col gap-2">
                    {q.options.map((opt: string, optIndex: number) => (
                      <div key={optIndex} className="flex gap-2">
                        <input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options]
                            newOpts[optIndex] = e.target.value
                            updateQuestion(index, 'options', newOpts)
                          }}
                        />
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            const newOpts = q.options.filter((_: any, i: number) => i !== optIndex)
                            updateQuestion(index, 'options', newOpts)
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-secondary mt-2"
                      onClick={() =>
                        updateQuestion(index, 'options', [
                          ...q.options,
                          `Option ${q.options.length + 1}`,
                        ])
                      }
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-muted text-center">No questions added yet.</p>
          )}
        </div>

        <div className="flex justify-end mt-8 mb-8">
          {id !== 'new' && (
            <Link
              to="/s/$id"
              params={{ id: survey.id }}
              target="_blank"
              className="btn btn-secondary"
              style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
            >
              🔗 Open Share Link
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
