import { Hono } from 'hono'
import { cors } from 'hono/cors'

import authRoutes from './routes/auth'
import surveyRoutes from './routes/surveys'
import responseRoutes from './routes/responses'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Frontend dev server
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/surveys', surveyRoutes)
app.route('/api/responses', responseRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
