import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/s/$id')({
  component: PublicSurvey,
})

function PublicSurvey() {
  const { id } = Route.useParams()
  const [survey, setSurvey] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Local state for answers: { question_id: value }
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSurvey()
  }, [id])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Format answers array
    const formattedAnswers = Object.keys(answers).map((qId) => ({
      question_id: qId,
      value: answers[qId],
    }))

    try {
      await fetch(`http://localhost:8787/api/responses/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Failed to submit response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <div className="container mt-8 text-center">Loading survey...</div>
  if (!survey)
    return (
      <div className="container mt-8 text-center">Survey not found or is no longer available.</div>
    )

  if (submitted) {
    return (
      <div
        className="container flex-col items-center justify-center animate-fade-in"
        style={
          { minHeight: '100vh', display: 'flex', '--brand-primary': survey.brand_color } as any
        }
      >
        <div className="card text-center" style={{ width: '100%', maxWidth: '500px' }}>
          {survey.brand_logo_url && (
            <img src={survey.brand_logo_url} alt="Brand Logo" className="brand-logo mb-4" />
          )}
          <h2>Thank You!</h2>
          <p className="text-muted">Your response has been successfully submitted.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="container flex-col animate-fade-in"
      style={
        {
          minHeight: '100vh',
          display: 'flex',
          padding: '4rem 1rem',
          '--brand-primary': survey.brand_color,
        } as any
      }
    >
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        <div className="text-center mb-8">
          {survey.brand_logo_url && (
            <img src={survey.brand_logo_url} alt="Brand Logo" className="brand-logo mb-4" />
          )}
          <h1 style={{ color: survey.brand_color }}>{survey.title}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="card">
              <label style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                {idx + 1}. {q.title}
              </label>

              {q.type === 'short_text' && (
                <input
                  type="text"
                  placeholder="Your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  required
                />
              )}

              {q.type === 'multiple_choice' && (
                <div className="flex-col gap-2">
                  {q.options.map((opt: string, i: number) => (
                    <label
                      key={i}
                      className="flex items-center gap-2"
                      style={{ cursor: 'pointer', margin: 0, fontWeight: 400 }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        required
                        style={{ width: 'auto' }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'rating' && (
                <div className="flex gap-4 justify-between" style={{ maxWidth: '300px' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      className="flex-col items-center gap-2"
                      style={{ cursor: 'pointer', margin: 0, fontWeight: 400 }}
                    >
                      <span>{rating}</span>
                      <input
                        type="radio"
                        name={q.id}
                        value={rating.toString()}
                        checked={answers[q.id] === rating.toString()}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        required
                        style={{ width: 'auto' }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 ? (
            <p className="text-center text-muted">This survey has no questions.</p>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '1rem', fontSize: '1.125rem' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
