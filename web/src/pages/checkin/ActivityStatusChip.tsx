import { Circle } from '@mui/icons-material'
import { Chip } from '@mui/material'
import { ParticipantStatus } from '@shared/api/activity'

const statusText: Record<ParticipantStatus, string> = {
  [ParticipantStatus.NotResponding]: 'Not Responding',
  [ParticipantStatus.Remote]: 'In Town',
  [ParticipantStatus.Standby]: 'Standby',
  [ParticipantStatus.SignedIn]: 'Responding',
  [ParticipantStatus.SignedOut]: 'Signed Out',
  [ParticipantStatus.Available]: 'Available',
  [ParticipantStatus.Assigned]: 'Assigned',
  [ParticipantStatus.Demobilized]: 'Demobilized',
}

const statusColor: Record<ParticipantStatus, 'success' | 'error' | 'warning' | 'disabled'> = {
  [ParticipantStatus.NotResponding]: 'disabled',
  [ParticipantStatus.Remote]: 'success',
  [ParticipantStatus.Standby]: 'warning',
  [ParticipantStatus.SignedIn]: 'success',
  [ParticipantStatus.SignedOut]: 'error',
  [ParticipantStatus.Available]: 'success',
  [ParticipantStatus.Assigned]: 'success',
  [ParticipantStatus.Demobilized]: 'warning',
}

export function ActivityStatusChip({ status }: { status: ParticipantStatus }) {
  return (
    <Chip
      icon={<Circle color={statusColor[status]} />}
      label={statusText[status]}
      variant="outlined"
      size="small"
    />
  )
}
