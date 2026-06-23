import { Activity, ActivityWithMeta, NewActivityArgs, OrganizationStatus, ParticipantStatus, ParticipantUpdate } from '@shared/api/activity'
import { ActivityModel } from '@web/model/activityModel.js'
import { computed, makeObservable, observable, runInAction } from 'mobx'
import { createContext, useContext } from 'react'

import { OrganizationsStore } from './organizationStore.js'
import WebsocketStore from './websocketStore'

function sortActivities(a: Activity, b: Activity) {
  if (a.isMission === b.isMission) {
    return a.startTime > b.startTime ? 1 : -1
  }
  return a.isMission ? 1 : -1
}

export class ActivitiesStore {
  @observable accessor activeActivities: ActivityModel[] = []
  @observable accessor loaded: boolean = false
  @observable accessor loading: boolean = false

  constructor(
    private readonly memberId: string | undefined,
    private readonly orgStore: OrganizationsStore,
    private readonly socketStore: WebsocketStore,
  ) {
    makeObservable(this)
  }

  @computed
  get missionCapableOrgs() {
    return this.orgStore.knownOrgs.filter(f => f.canCreateMissions)
  }

  @computed
  get eventCapableOrgs() {
    return this.orgStore.knownOrgs.filter(f => f.canCreateEvents)
  }

  @computed
  get myCurrentActivities() {
    const participantId = this.memberId
    if (!participantId) {
      return []
    }

    const myParticipation: { activity: ActivityModel; status: ParticipantUpdate }[] = []
    for (const activity of this.activeActivities) {
      const myUpdate = activity.participants[participantId]?.timeline[0]
      if (myUpdate && myUpdate.status !== ParticipantStatus.NotResponding) {
        myParticipation.push({ activity, status: myUpdate })
      }
    }

    return myParticipation.sort((a, b) => sortActivities(a.activity, b.activity))
  }

  @computed
  get activeMissions() {
    return this.activeActivities.filter(f => f.isMission).sort(sortActivities)
  }

  @computed
  get activeEvents() {
    return this.activeActivities.filter(f => !f.isMission).sort(sortActivities)
  }

  async load(force?: boolean) {
    if ((this.loaded || this.loading) && !force) {
      return
    }

    runInAction(() => this.loading = true)
    try {
      await this.orgStore.load()
      const response = await fetch('/api/activity/active')
      const json = await response.json()
      const list = (json.result as ActivityWithMeta[]).map(a => new ActivityModel(a))
      runInAction(() => {
        this.activeActivities = list
        this.loaded = true
      })
    } finally {
      runInAction(() => this.loading = false)
    }
  }

  async getActivity(activityId: string): Promise<ActivityModel | undefined> {
    let activity = this.activeActivities.find(f => f.id === activityId)
    if (!activity) {
      const response = await fetch(`/api/activity/${activityId}`)
      if (response.ok) {
        activity = (await response.json()).result
      }
    }
    return activity
  }

  async create(activity: NewActivityArgs): Promise<ActivityModel> {
    const owner = this.orgStore.knownOrgs.find(f => f.id === activity.ownerOrgId)!
    const model: Omit<Activity, 'id'> = {
      ...activity,
      participants: {},
      organizations: {
        [activity.ownerOrgId]: {
          ...owner, timeline: [
            { status: activity.forceStandbyOnly ? OrganizationStatus.Standby : OrganizationStatus.Responding, time: new Date().getTime() }
          ]
        },
      }
    }

    const response = await fetch('/api/activity', { method: 'POST', body: JSON.stringify(model) })
    const result = await response.json()
    if (response.ok) {
      const data = new ActivityModel(result.data)
      runInAction(() => this.activeActivities.unshift(data))
      return data
    }
    throw new Error('error creating activity')
  }
}

const ActivitiesContextInstance = createContext<ActivitiesStore | null>(null)

export const ActivitiesProvider = ({ store, children }: { store: ActivitiesStore; children: React.ReactNode }) => (
  <ActivitiesContextInstance.Provider value={store}>{children}</ActivitiesContextInstance.Provider>
)

export const useActivitiesContext = () => {
  const ActivitiesContext = useContext(ActivitiesContextInstance)

  if (!ActivitiesContext) {
    throw new Error('useActivitiesContext must be used within <ActivitiesProvider>')
  }

  return ActivitiesContext
}
