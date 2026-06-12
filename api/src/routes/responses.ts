import { Hono } from 'hono'

const responses = new Hono<{ Bindings: Env }>()

// Middleware to mock verify user
const requireUser = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(token).first()
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  await next()
}

// Submit a response (Public)
responses.post('/:surveyId', async (c) => {
  const surveyId = c.req.param('surveyId')
  const { answers } = await c.req.json()

  const db = c.env.DB

  const survey = await db.prepare('SELECT id FROM surveys WHERE id = ?').bind(surveyId).first()
  if (!survey) return c.json({ error: 'Survey not found' }, 404)

  const responseId = crypto.randomUUID()
  const submittedAt = Date.now()

  const batch = []
  batch.push(
    db
      .prepare('INSERT INTO responses (id, survey_id, submitted_at) VALUES (?, ?, ?)')
      .bind(responseId, surveyId, submittedAt),
  )

  for (const answer of answers) {
    batch.push(
      db
        .prepare('INSERT INTO answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)')
        .bind(crypto.randomUUID(), responseId, answer.question_id, answer.value),
    )
  }

  await db.batch(batch)

  return c.json({ success: true, responseId })
})

// Get responses for a specific survey (Owner only)
responses.get('/:surveyId', requireUser, async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('surveyId')

  const db = c.env.DB

  // Verify ownership
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ? AND owner_id = ?')
    .bind(surveyId, user.id)
    .first()
  if (!survey) return c.json({ error: 'Not found or unauthorized' }, 404)

  const { results: responsesList } = await db
    .prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC')
    .bind(surveyId)
    .all()

  const { results: answersList } = await db
    .prepare(
      `SELECT a.* FROM answers a JOIN responses r ON a.response_id = r.id WHERE r.survey_id = ?`,
    )
    .bind(surveyId)
    .all()

  // Format responses
  const formattedResponses = responsesList.map((res: any) => {
    const resAnswers = answersList.filter((a: any) => a.response_id === res.id)
    return {
      id: res.id,
      submitted_at: res.submitted_at,
      answers: resAnswers,
    }
  })

  return c.json({ responses: formattedResponses })
})

export default responses
