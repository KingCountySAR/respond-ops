import { ArrowDropDown } from '@mui/icons-material'
import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, type SxProps, type Theme } from '@mui/material'
import { Activity, ParticipantStatus } from '@shared/api/activity'
import { ActivityAction } from '@web/store/activitiesUiStore'
import { useRef, useState } from 'react'

type ActivityActionButtonProps = {
  activity: Activity
  actions: ActivityAction[]
  onUpdateStatus: (activity: Activity, status: ParticipantStatus) => void
}

const styles = {
  primaryButton: { minWidth: 122, fontWeight: 400, letterSpacing: '0.05em' },
} satisfies Record<string, SxProps<Theme>>

export function ActivityActionButton({ activity, actions, onUpdateStatus }: ActivityActionButtonProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirmAction, setConfirmAction] = useState<ActivityAction | undefined>()
  const buttonGroupRef = useRef<HTMLDivElement | null>(null)
  const primaryAction = actions[0]

  const handleMenu = () => setMenuAnchor(buttonGroupRef.current)
  const handleClose = () => setMenuAnchor(null)
  const promptUpdate = (action: ActivityAction) => {
    handleClose()
    setConfirmAction(action)
  }
  const updateStatus = () => {
    if (confirmAction) {
      onUpdateStatus(activity, confirmAction.newStatus)
      setConfirmAction(undefined)
    }
  }

  return (
    <>
      <ButtonGroup ref={buttonGroupRef} variant="contained" aria-label="split button">
        <Button onClick={() => promptUpdate(primaryAction)} sx={styles.primaryButton}>{primaryAction.label}</Button>
        {actions.length > 1 && (
          <Button size="small" aria-label="select merge strategy" aria-haspopup="menu" onClick={handleMenu}>
            <ArrowDropDown />
          </Button>
        )}
      </ButtonGroup>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {actions.slice(1).map(action => (
          <MenuItem key={action.id} onClick={() => promptUpdate(action)}>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(undefined)} aria-labelledby="status-update-dialog-title" aria-describedby="status-update-dialog-description">
        <DialogTitle id="status-update-dialog-title">Update Status</DialogTitle>
        <DialogContent>
          <DialogContentText id="status-update-dialog-description">
            Change your status for {activity.title}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(undefined)}>Cancel</Button>
          <Button onClick={updateStatus} autoFocus>{confirmAction?.label}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
