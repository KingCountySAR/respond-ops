import './config.js'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { BootData } from '@shared/api/environment.js'
import type { ApiResponse } from '@shared/api/index.js'
import { readFileSync } from 'fs'
import { Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { resolve } from 'path'
import { WebSocketServer } from 'ws'

import { getDb, SESSIONS_COLLECTION } from './db/index.js'
import { connectDb } from './db/mongo.js'
import { domainFromRequest } from './lib/request.js'
import { getUserFromSession } from './lib/session.js'
import { setupActivityRoutes } from './routes/api/activitiesApi.js'
import { setupEnvironmentApi } from './routes/api/environmentApi.js'
import { setupLocationRoutes } from './routes/api/locationsApi.js'
import { setupOrganizationRoutes } from './routes/api/organizationsApi.js'
import { setupAuthRoutes } from './routes/auth.js'
import { setupWebsockets, WebsocketManager } from './routes/websockets.js'
import { ActivityService } from './svc/activityService.js'
import { OrganizationService } from './svc/organizationService.js'

const CLIENT_DIST = resolve(process.cwd(), './static')
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID missing from config')
}

const orgService = new OrganizationService()
const activityService = new ActivityService(orgService, getDb)

async function getBootDataForRequest(c: Context): Promise<BootData> {
  const domain = domainFromRequest(c)

  const data: BootData = {
    googleClientId: GOOGLE_CLIENT_ID!,
    environment: await orgService.getEnvironmentForDomain(domain),
  }
  const sessionLogin = await getUserFromSession(c)
  if (sessionLogin) {
    const { id, ...clientParts } = sessionLogin
    data.login = clientParts
  }
  return data
}


const app = new Hono()

app.use('/api/*', cors())

app.route('/api/auth', setupAuthRoutes(orgService))
app.route('/api', setupEnvironmentApi(getBootDataForRequest))
app.route('/api', setupLocationRoutes())
app.route('/api', setupOrganizationRoutes(orgService))
app.route('/api', setupActivityRoutes(activityService))

const wss = new WebSocketServer({ noServer: true })
const socketManager = new WebsocketManager(wss)
app.route('/ws', setupWebsockets(socketManager))

app.get('/api/health', (c) => {
  const response: ApiResponse<{ status: string }> = {
    data: { status: 'ok' },
  }
  return c.json(response)
})

const indexHandler = async (c: Context) => {
  const accept = c.req.header('Accept') ?? ''
  if (accept.length > 0 && !accept.includes('text/html')) {
    return c.text('not found', 404)
  }

  const data = await getBootDataForRequest(c)
  const script = `<script>window.environmentBootConfig = ${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`

  let html = readFileSync(resolve(CLIENT_DIST, 'index.html'), 'utf-8')
  html = html.replace('<!-- BOOT_DATA -->', script)
  return c.html(html)
}

app.get('/', indexHandler)

// Static assets (JS/CSS/images from Vite build)
app.use('*', serveStatic({ root: CLIENT_DIST, onFound: (_path, c) => {
  c.header('Cache-Control', 'public, immutable, max-age=60400') // Cache for 1 week
} }))

//SPA fallback — any unmatched route serves index.html so React Router can handle it
app.get('*', indexHandler)


const port = Number(process.env.PORT ?? 3000)

async function purgeExpiredSessions() {
  const result = await getDb().collection(SESSIONS_COLLECTION)
    .deleteMany({ expires: { $lt: new Date().toISOString() } })
  if (result.deletedCount > 0) {
    console.log(`Purged ${result.deletedCount} expired session(s)`)
  }
}

connectDb().then(() => {
  purgeExpiredSessions()
  setInterval(purgeExpiredSessions, 60 * 60 * 1000)

  serve({ fetch: app.fetch, port, websocket: { server: wss } }, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
})
