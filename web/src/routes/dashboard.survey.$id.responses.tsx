import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'

export const Route = createFileRoute('/dashboard/survey/$id/responses')({
  component: SurveyResponses,
})

function SurveyResponses() {
  const { id } = Route.useParams()
  const { token, loading, user } = useAuth()

  const [survey, setSurvey] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, id])

  const fetchData = async () => {
    try {
      const [surveyRes, responsesRes] = await Promise.all([
        fetch(`http://localhost:8787/api/surveys/${id}`),
        fetch(`http://localhost:8787/api/responses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const surveyData = await surveyRes.json()
      const responsesData = await responsesRes.json()

      if (surveyData.survey) {
        setSurvey(surveyData.survey)
        setQuestions(surveyData.questions || [])
      }
      if (responsesData.responses) setResponses(responsesData.responses)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  if (loading || fetching) return <div className="container mt-8 text-center">Loading...</div>
  if (!survey) return <div className="container mt-8 text-center">Survey not found</div>

  return (
    <div
      className="container animate-fade-in"
      style={{ '--brand-primary': survey.brand_color } as any}
    >
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="btn btn-secondary"
          style={{ padding: '0.25rem 0.5rem', marginBottom: '1rem', display: 'inline-block' }}
        >
          &larr; Back to Dashboard
        </Link>
        <h2>
          Responses: <span style={{ color: survey.brand_color }}>{survey.title}</span>
        </h2>
        <p className="text-muted">Total Responses: {responses.length}</p>
      </div>

      {responses.length === 0 ? (
        <div className="card text-center text-muted">
          No responses yet. Share your survey to collect data!
        </div>
      ) : (
        <div className="flex-col gap-8">
          {responses.map((resp, i) => (
            <div key={resp.id} className="card">
              <h4 className="mb-4">Response #{responses.length - i}</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                Submitted: {new Date(resp.submitted_at).toLocaleString()}
              </p>
              <div className="flex-col gap-4">
                {questions.map((q, idx) => {
                  const answer = resp.answers.find((a: any) => a.question_id === q.id)
                  return (
                    <div key={q.id}>
                      <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                        {idx + 1}. {q.title}
                      </p>
                      <p
                        className="text-muted"
                        style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}
                      >
                        {answer ? answer.value : <em>No answer</em>}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
