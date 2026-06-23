import { Box, Chip, type SxProps, type Theme } from '@mui/material'
import { Activity } from '@shared/api/activity'
import { ActivitiesUiStore } from '@web/store/activitiesUiStore'

const styles = {
  container: { mt: 2 },
  chip: { mr: 1 },
} satisfies Record<string, SxProps<Theme>>

export function ParticipatingOrgChips({ activity, uiStore }: { activity: Activity; uiStore: ActivitiesUiStore }) {
  return (
    <Box sx={styles.container}>
      {uiStore.getParticipatingOrgChips(activity).map(org => (
        <Chip
          key={org.id}
          size="small"
          sx={styles.chip}
          label={org.label}
          color={org.color}
          variant="outlined"
        />
      ))}
    </Box>
  )
}
