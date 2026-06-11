import { ACTIVITIES_COLLECTION, ActivityDoc } from '@server/db/index.js'
import { SessionLogin } from '@server/model/auth.js'
import { Activity } from '@shared/api/activity.js'
import { subDays } from 'date-fns'
import { Db, WithId } from 'mongodb'

import { OrganizationService } from './organizationService.js'

interface ActivityAuth {
  canEdit: boolean;
}

export class ActivityService {
  private active: WithId<ActivityDoc>[] = []

  constructor(
    private readonly orgService: OrganizationService,
    private readonly getDb: () => Db,
  ) {
  }

  async reload(force?: boolean) {
    if (this.active.length === 0 || force) {
      this.active = await this.getDb().collection<ActivityDoc>(ACTIVITIES_COLLECTION).find({
        removeTime: undefined,
        $or: [
          { endTime: undefined },
          { endTime: { $gt: subDays(new Date(), 3).getTime() } },
        ]
      }).toArray()
    }
  }

  async getActiveVisibleToOrgs(orgIds: string[]) {
    await this.reload()
    return this.active.filter(a => orgIds.includes(a.ownerOrgId))
  }

  async getAllActivitiesForOrgs(orgIds: string[], type: 'missions'|'events') {
    const docs = await this.getDb().collection<ActivityDoc>(ACTIVITIES_COLLECTION)
      .find({ isMission: type === 'missions', removeTime: undefined, $or: orgIds.map(id => ({ [`organizations.${id}`]: { $exists: true } })) })
      .toArray()
    return docs
  }

  async getActivity(id: string) {
    await this.reload()
    let activity: WithId<ActivityDoc>|null|undefined = this.active.find(f => f.id === id)
    if (!activity) {
      activity = await this.getDb().collection<ActivityDoc>(ACTIVITIES_COLLECTION).findOne({ id, removeTime: undefined })
    }
    return activity ? activity : undefined
  }

  async persist(activity: Omit<Activity, 'id'> & { id?: string }, login: SessionLogin): Promise<Activity> {
    if (!activity.ownerOrgId) {
      throw new Error('Activities must be owned by an organization')
    }
    if (!login.myOrgIds.includes(activity.ownerOrgId)) {
      throw new Error('Activities must belong to one of your organizations')
    }
    const ownerOrg = await this.orgService.getUserOrg(activity.ownerOrgId)
    if (activity.isMission && !ownerOrg.canCreateMissions) {
      throw new Error('Missions may not be added to this organization')
    } else if (!activity.isMission && !ownerOrg.canCreateEvents) {
      throw new Error('Events may not be added to this organization')
    }

    const doc: ActivityDoc = {
      ...activity,
      id: activity.id ?? crypto.randomUUID()
    }

    await this.getDb().collection<ActivityDoc>(ACTIVITIES_COLLECTION).replaceOne(
      { id: doc.id },
      doc,
      { upsert: true }
    )
    return doc
  }

  calcAuth(activity: Activity, login: SessionLogin): ActivityAuth|undefined {
    if (login.myOrgIds.includes(activity.ownerOrgId)) {
      return { canEdit: true }
    }
    if (Object.keys(activity.organizations).some(activityOrgId => login.myOrgIds.includes(activityOrgId))) {
      return { canEdit: false }
    }
    return undefined
  }

  toClientWithMeta(activity: Activity|WithId<ActivityDoc>, login: SessionLogin) {
    let clientParameters: Activity
    if (this.isDbDoc(activity)) {
      const { _id, removeTime, ...rest } = activity
      clientParameters = rest
    } else {
      clientParameters = activity
    }
    const auth = this.calcAuth(clientParameters, login)
    if (!auth) {
      throw new Error('permission denied')
    }

    return {
      ...clientParameters,
      meta: {
        canEdit: auth.canEdit
      }
    }
  }

  private isDbDoc(activity: Activity|ActivityDoc): activity is WithId<ActivityDoc> {
    return '_id' in activity || 'removeTime' in activity
  }
}
