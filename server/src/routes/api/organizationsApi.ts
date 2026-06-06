import { AuthVariables, withApiLogin } from '@server/middleware/auth.js'
import { SessionLogin } from '@server/model/auth.js'
import { OrganizationService } from '@server/svc/organizationService.js'
import { Hono } from 'hono'

export function setupOrganizationRoutes(svc: OrganizationService) {
  const apiRoutes = new Hono<{ Variables: AuthVariables }>()

  /** List organizationsfor user */
  apiRoutes.get('/organizations', withApiLogin, async (c) => {
    const login = c.get('login') as SessionLogin
    const orgs = await svc.listUsersOrgs(login.orgId)
    return c.json({ data: orgs })
  })

  return apiRoutes
}
