import { Activity, ActivityWithMeta, Participant, ParticipatingOrg } from '@shared/api/activity'
import { Location } from '@shared/api/location'

export class ActivityModel implements Activity {
  readonly id: string
  idNumber!: string
  title!: string
  description!: string
  location!: Location
  mapId!: string
  ownerOrgId!: string
  isMission!: boolean
  asMission!: boolean
  forceStandbyOnly!: boolean
  startTime!: number
  endTime?: number | undefined
  earlySignInWindow?: number | undefined
  participants!: Record<string, Participant>
  organizations!: Record<string, ParticipatingOrg>

  constructor(api: ActivityWithMeta) {
    const { id, meta, ...rest } = api
    this.id = api.id
    Object.assign(this, rest)
  }

  get isActive() {
    return !this.endTime
  }
}
