import { Hono } from 'hono'

const auth = new Hono<{ Bindings: Env }>()

// A very simple mock auth for MVP:
// We just take an email, upsert it in the DB, and return the user ID as a token.
// In a real app, this would use proper sessions or JWTs.
auth.post('/login', async (c) => {
  const { email } = await c.req.json()
  if (!email) return c.json({ error: 'Email is required' }, 400)

  const db = c.env.DB

  // Try to find the user
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

  if (!user) {
    // Create new user
    const id = crypto.randomUUID()
    await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run()
    user = { id, email }
  }

  // Returning user ID as a mock token
  return c.json({ token: user.id, user })
})

auth.get('/me', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(token).first()

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  return c.json({ user })
})

export default auth
