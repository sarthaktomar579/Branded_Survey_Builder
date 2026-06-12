import { Hono } from 'hono'

const surveys = new Hono<{ Bindings: Env }>()

// Middleware to mock verify user
const requireUser = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(token).first()
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  await next()
}

// Get all surveys for current user
surveys.get('/', requireUser, async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM surveys WHERE owner_id = ? ORDER BY created_at DESC',
  )
    .bind(user.id)
    .all()
  return c.json({ surveys: results })
})

// Create a new survey
surveys.post('/', requireUser, async (c) => {
  const user = c.get('user')
  const { title, brand_color, brand_logo_url, questions } = await c.req.json()
  const id = crypto.randomUUID()
  const created_at = Date.now()
  const color = brand_color || '#3b82f6'

  const db = c.env.DB
  const batch = []

  batch.push(
    db
      .prepare(
        'INSERT INTO surveys (id, owner_id, title, brand_color, brand_logo_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(id, user.id, title, color, brand_logo_url || null, created_at),
  )

  if (questions && questions.length > 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const qId = q.id || crypto.randomUUID()
      batch.push(
        db
          .prepare(
            'INSERT INTO questions (id, survey_id, type, title, options, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(qId, id, q.type, q.title, q.options ? JSON.stringify(q.options) : null, i),
      )
    }
  }

  await db.batch(batch)

  return c.json({ id, title, brand_color: color, created_at })
})

// Get a specific survey (Public - no auth required to just view the survey)
surveys.get('/:id', async (c) => {
  const id = c.req.param('id')

  const survey = await c.env.DB.prepare('SELECT * FROM surveys WHERE id = ?').bind(id).first()
  if (!survey) return c.json({ error: 'Survey not found' }, 404)

  const { results: questions } = await c.env.DB.prepare(
    'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC',
  )
    .bind(id)
    .all()

  // Parse options for multiple_choice questions
  const parsedQuestions = questions.map((q: any) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : [],
  }))

  return c.json({ survey, questions: parsedQuestions })
})

// Update a survey and its questions
surveys.put('/:id', requireUser, async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const { title, brand_color, brand_logo_url, questions } = await c.req.json()

  const db = c.env.DB

  // Verify ownership
  const survey = await db
    .prepare('SELECT * FROM surveys WHERE id = ? AND owner_id = ?')
    .bind(surveyId, user.id)
    .first()
  if (!survey) return c.json({ error: 'Not found or unauthorized' }, 404)

  // Start batch for atomic update
  const batch = []

  // Update survey details
  batch.push(
    db
      .prepare('UPDATE surveys SET title = ?, brand_color = ?, brand_logo_url = ? WHERE id = ?')
      .bind(title, brand_color, brand_logo_url || null, surveyId),
  )

  // For simplicity, we delete all existing questions and insert the new ones
  batch.push(db.prepare('DELETE FROM questions WHERE survey_id = ?').bind(surveyId))

  if (questions && questions.length > 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const qId = q.id || crypto.randomUUID()
      batch.push(
        db
          .prepare(
            'INSERT INTO questions (id, survey_id, type, title, options, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(qId, surveyId, q.type, q.title, q.options ? JSON.stringify(q.options) : null, i),
      )
    }
  }

  await db.batch(batch)

  return c.json({ success: true })
})

export default surveys
