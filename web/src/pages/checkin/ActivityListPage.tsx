import { Box, Button, Typography, type SxProps, type Theme } from '@mui/material'
import { ToolbarPage } from '@web/components/ToolbarPage'
import { useActivitiesContext } from '@web/store/activitiesStore'
import { ActivitiesUiStore } from '@web/store/activitiesUiStore'
import { observer } from 'mobx-react-lite'
import { ReactNode, useEffect, useMemo } from 'react'
import { Link } from 'react-router'

import { ActivityStack } from './ActivityTile'

const styles = {
  activitySection: { mb: 3 },
  activitySectionHeader: { mb: 1 },
  activitySectionHeaderWithAction: { mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  page: { bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', mx: -3, my: -3, p: 3 },
  eventsSection: { pb: 4 },
} satisfies Record<string, SxProps<Theme>>

function ActivitySection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const headerSx = action === undefined
    ? styles.activitySectionHeader
    : styles.activitySectionHeaderWithAction

  return (
    <Box sx={styles.activitySection}>
      <Box sx={headerSx}>
        <Typography variant="h5">{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  )
}

export const ActivityListPage = observer(() => {
  const activitiesStore = useActivitiesContext()
  const activitiesUiStore = useMemo(() => new ActivitiesUiStore(activitiesStore), [activitiesStore])

  useEffect(() => {
    document.title = 'Event list'
    activitiesStore.load()
  }, [activitiesStore])

  return (
    <ToolbarPage>
      <Box component="main" sx={styles.page}>
        {activitiesUiStore.myCurrentActivities.length >= 1 && (
          <ActivitySection title="My Activity">
            <ActivityStack
              type="myActivity"
              activities={activitiesUiStore.myCurrentActivities.map(({ activity }) => activity)}
              statusMap={activitiesUiStore.currentParticipantStatusByActivityId}
              uiStore={activitiesUiStore}
            />
          </ActivitySection>
        )}

        <ActivitySection
          title="Missions"
          action={activitiesUiStore.canCreateMissions && <Button variant="outlined" component={Link} to={activitiesUiStore.getNewActivityPath('missions')}>New Mission</Button>}
        >
          <ActivityStack type="missions" activities={activitiesUiStore.missions} statusMap={activitiesUiStore.currentParticipantStatusByActivityId} uiStore={activitiesUiStore} />
        </ActivitySection>

        <Box sx={styles.eventsSection}>
          <Box sx={styles.activitySectionHeaderWithAction}>
            <Typography variant="h5">Events</Typography>
            {activitiesUiStore.canCreateEvents && <Button variant="outlined" component={Link} to={activitiesUiStore.getNewActivityPath('events')}>New Event</Button>}
          </Box>
          <ActivityStack type="events" activities={activitiesUiStore.events} statusMap={activitiesUiStore.currentParticipantStatusByActivityId} uiStore={activitiesUiStore} />
        </Box>
      </Box>
    </ToolbarPage>
  )
})
