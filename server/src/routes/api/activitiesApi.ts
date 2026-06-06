import { type ActivityDoc } from '@server/db/index.js'
import { AuthVariables, withApiLogin } from '@server/middleware/auth.js'
import { type SessionLogin } from '@server/model/auth.js'
import { ActivityService } from '@server/svc/activityService.js'
import { NewActivityArgs, type Activity, type ActivityType } from '@shared/api/activity.js'
import { Context, Hono } from 'hono'
import { type WithId } from 'mongodb'

function docToClient(doc: WithId<ActivityDoc> | null): Activity | undefined {
  if (!doc) {
    return undefined
  }

  const { _id, removeTime, ...result } = doc
  return result
}

export function setupActivityRoutes(svc: ActivityService) {
  async function listActivities(type: ActivityType, c: Context) {
    console.log('listing activities')
    const login = c.get('login') as SessionLogin
    const docs = await svc.getAllActivitiesForOrgs(login.myOrgIds, type)
    return c.json({ result: docs.map(docToClient) })
  }
  const apiRoutes = new Hono<{ Variables: AuthVariables }>()

  apiRoutes.get('/events', withApiLogin, listActivities.bind(null, 'events'))
  apiRoutes.get('/missions', withApiLogin, listActivities.bind(null, 'missions'))

  apiRoutes.get('/activity/active', withApiLogin, async (c) => {
    const login = c.get('login') as SessionLogin
    const docs = await svc.getActiveVisibleToOrgs(login.myOrgIds)
    return c.json({ result: docs.map(d => svc.toClientWithMeta(d, login)) })
  })

  apiRoutes.get('/activity/:activityId', withApiLogin, async (c) => {
    const { activityId } = c.req.param()
    const login = c.get('login') as SessionLogin
    const doc = await svc.getActivity(activityId)
    if (!doc) {
      return c.json('not found', 404)
    }
    const docAuth = svc.calcAuth(doc, login)
    if (!docAuth) {
      return c.json('no permission', 403)
    }

    return c.json({ result: docToClient(doc) })
  })

  apiRoutes.post('/activity', withApiLogin, async (c) => {
    const login = c.get('login') as SessionLogin
    const body = await c.req.json<Omit<Activity, 'id'>>()
    const result = await svc.persist(body, login)
    const data = svc.toClientWithMeta(result, login)
    return c.json({ data })
  })

  return apiRoutes
}
