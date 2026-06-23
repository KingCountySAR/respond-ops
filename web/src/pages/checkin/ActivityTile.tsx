import { Stack, Typography } from '@mui/material'
import { Activity, ParticipantStatus } from '@shared/api/activity'
import { ActivitiesUiStore, type ActivityRowsOptions } from '@web/store/activitiesUiStore'

import { ActivityCard } from './ActivityCard'
import { ActivityDetailRows } from './ActivityDetailRows'
import { ParticipatingOrgChips } from './ParticipatingOrgChips'

export type ActivityTileProps = {
  activity: Activity
  status?: ParticipantStatus
  uiStore: ActivitiesUiStore
  showOrgs?: boolean
  rowOptions?: ActivityRowsOptions
}

type ActivityStackType = 'missions' | 'events' | 'myActivity'

type ActivityStackProps = {
  type: ActivityStackType
  activities: Activity[]
  statusMap?: Record<string, ParticipantStatus>
  uiStore: ActivitiesUiStore
  showOrgs?: boolean
}

function getActivityStatus(type: ActivityStackType, activity: Activity, statusMap?: Record<string, ParticipantStatus>) {
  if (type === 'myActivity') {
    return statusMap?.[activity.id] ?? ParticipantStatus.NotResponding
  }

  return statusMap?.[activity.id]
}

export function ActivityTile({
  activity,
  status,
  uiStore,
  showOrgs = true,
  rowOptions,
}: ActivityTileProps) {
  return (
    <ActivityCard activity={activity} status={status} uiStore={uiStore}>
      <ActivityDetailRows rows={uiStore.getActivityRows(activity, rowOptions)} />
      {showOrgs && <ParticipatingOrgChips activity={activity} uiStore={uiStore} />}
    </ActivityCard>
  )
}

export function ActivityStack({
  type,
  activities,
  statusMap,
  uiStore,
  showOrgs = true,
}: ActivityStackProps) {
  const isMyActivity = type === 'myActivity'
  const tileRowOptions = isMyActivity ? { showDemNumber: false, showActiveResponders: false } : undefined

  return (
    <Stack spacing={1}>
      {activities.map(activity => (
        <ActivityTile
          key={activity.id}
          activity={activity}
          status={getActivityStatus(type, activity, statusMap)}
          uiStore={uiStore}
          showOrgs={!isMyActivity && showOrgs}
          rowOptions={tileRowOptions}
        />
      ))}
      {activities.length === 0 && type !== 'myActivity' && <Typography>No recent {type}</Typography>}
    </Stack>
  )
}
