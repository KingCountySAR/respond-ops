import { Box, Card, CardActions, Link as MuiLink, Typography, type SxProps, type Theme } from '@mui/material'
import { Activity, ParticipantStatus } from '@shared/api/activity'
import { ActivitiesUiStore } from '@web/store/activitiesUiStore'
import { ReactNode } from 'react'
import { Link } from 'react-router'

import { ActivityActionButton } from './ActivityActionButton'
import { ActivityLinks } from './ActivityLinks'
import { ActivityStatusChip } from './ActivityStatusChip'

type ActivityCardProps = {
  activity: Activity
  status?: ParticipantStatus
  uiStore: ActivitiesUiStore
  children?: ReactNode
}

const styles = {
  header: { pb: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' },
  headerTitleContainer: { flexGrow: 1 },
  title: { fontWeight: 'bold' },
  actions: { p: 1 },
  actionsContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  card: { borderRadius: 1 },
  content: { p: 1 },
} satisfies Record<string, SxProps<Theme>>

function ActivityHeader({ activity, status, uiStore }: Omit<ActivityCardProps, 'children'>) {
  return (
    <Box sx={styles.header}>
      <Box sx={styles.headerTitleContainer}>
        <MuiLink component={Link} to={uiStore.getActivityPath(activity)} color="textPrimary" underline="hover">
          <Typography sx={styles.title} variant="h6">
            {activity.title}
          </Typography>
        </MuiLink>
      </Box>
      <Box>{status && <ActivityStatusChip status={status} />}</Box>
    </Box>
  )
}

function ActivityCardActions({ activity, status, uiStore }: Omit<ActivityCardProps, 'children'>) {
  if (!uiStore.isActivityActive(activity)) return null

  return (
    <CardActions sx={styles.actions}>
      <Box sx={styles.actionsContent}>
        <ActivityLinks activity={activity} />
        <ActivityActionButton activity={activity} actions={uiStore.getActivityActions(activity, status)} onUpdateStatus={uiStore.updateMyStatus} />
      </Box>
    </CardActions>
  )
}

export function ActivityCard({ activity, status, uiStore, children }: ActivityCardProps) {
  return (
    <Card elevation={1} sx={styles.card}>
      <Box sx={styles.content}>
        <ActivityHeader activity={activity} status={status} uiStore={uiStore} />
        <Box>{children}</Box>
      </Box>

      <ActivityCardActions activity={activity} status={status} uiStore={uiStore} />
    </Card>
  )
}
