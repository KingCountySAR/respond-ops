import AddLocation from '@mui/icons-material/AddLocation'
import Edit from '@mui/icons-material/Edit'
import { Box, Button, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Switch, TextField, type SxProps, type Theme } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { LocationAutocomplete } from '@web/components/locations/LocationAutocomplete.js'
import { ToolbarPage } from '@web/components/ToolbarPage'
import { ActivitiesStore, useActivitiesContext } from '@web/store/activitiesStore.js'
import { OrganizationsStore, useOrganizationsContext } from '@web/store/organizationStore'
import { hoursToMilliseconds } from 'date-fns'
import { computed, when } from 'mobx'
import MobxReactForm from 'mobx-react-form'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

const styles = {
  formGrid: { alignItems: 'center', padding: 2 },
  locationRow: { alignItems: 'center' },
  locationAction: { paddingRight: 2 },
  optionsGrid: { mt: 1 },
  helperGrid: { my: 1 },
  actionRow: { justifyContent: 'flex-end' },
} satisfies Record<string, SxProps<Theme>>

class CreateActivityUiStore {
  earlySignInWindowOptions: { value: number; label: string }[] = [
    { value: hoursToMilliseconds(4), label: '4 hours' },
    { value: hoursToMilliseconds(12), label: '12 hours' },
    { value: hoursToMilliseconds(24), label: '24 hours' },
    { value: Infinity, label: 'Open Immediately' },
  ]

  form = new MobxReactForm({ fields: [
    {
      name: 'title',
      label: 'Name',
    },
    {
      name: 'location',
      label: 'Location',
    },
    {
      name: 'mapId',
      label: 'Map ID',
    },
    {
      name: 'idNumber',
      label: 'State Number',
    },
    {
      name: 'ownerOrgId',
      label: 'Responsible Agency',
    },
    {
      name: 'earlySignInWindow',
      label: 'Early Sign In Window',
      value: this.earlySignInWindowOptions[0].value,
    },
    {
      name: 'startTime',
      label: 'Start Time',
      value: new Date(),
    },
    {
      name: 'description',
      label: 'Description',
    },
    {
      name: 'forceStandbyOnly',
      label: 'Standby Only',
      type: 'checkbox',
    }
  ] }, {
    hooks: {
      onSuccess: (form: MobxReactForm) => {
        this.activities.create(this.formResult)
        // get field values
        console.log('Form Values!', form.values())
      },
      onError: (form: MobxReactForm) => {
        alert('Form has errors!')
        // get all form errors
        console.log('All form errors', form.errors())
      }
    }
  })

  constructor(
    readonly type: 'events'|'missions',
    private readonly activities: ActivitiesStore,
    private readonly orgs: OrganizationsStore,
  ) {
    when(
      () => this.ownerOptions.length > 0,
      () => this.form.$('ownerOrgId').set('value', this.ownerOptions[0].id)
    )
  }

  @computed
  get earlySigninDisabled() {
    const v = this.form.$('startTime').value
    return v instanceof Date && v.getTime() < new Date().getTime()
  }

  @computed
  get ownerOptions() {
    return this.orgs.knownOrgs.filter(f => (this.type === 'missions' && f.canCreateMissions) || (this.type === 'events' && f.canCreateEvents))
  }

  @computed
  get formResult() {
    const v = this.form.values()
    return {
      title: v.title,
      description: v.description,
      location: v.location,
      mapId: v.mapId,
      idNumber: v.idNumber,
      ownerOrgId: v.ownerOrgId,
      isMission: this.type === 'missions',
      asMission: this.type === 'missions',
      forceStandbyOnly: !!v.forceStandbyOnly,
      startTime: (v.startTime as Date).getTime(),
      earlySignInWindow: v.earlySignInWindow || undefined,
      participants: {},
      organizations: {
        [v.ownerOrgId]: this.orgs.knownOrgs.find(f => f.id === v.ownerOrgId)!
      },
    }
  }

}

const _CreateActivityPage = observer(({ store }: { store: CreateActivityUiStore }) => {
  const navigate = useNavigate()

  const { form } = store
  const isNew = true

  return (
    <ToolbarPage>
      <Paper>
        <form>
          <Grid container spacing={2} sx={styles.formGrid}>
            <Grid size={12}>
              <FormControl fullWidth error={!!form.$('title').error}>
                <TextField {...form.$('title').bind()} variant="outlined" required />
                <FormHelperText>{form.$('title').error}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Stack direction="row" spacing={2} sx={styles.locationRow}>
                <FormControl fullWidth error={!!form.$('location').error}>
                  <LocationAutocomplete value={form.$('location').value} onChange={form.$('location').onChange} variant="outlined" required />
                  <FormHelperText>{form.$('location').error}</FormHelperText>
                </FormControl>
                <Box sx={styles.locationAction}>
                  <IconButton color="default" onClick={() => alert('TODO') /*setShowLocationEditDialog(true)*/}>
                    {form.$('location').value ? <Edit /> : <AddLocation />}
                  </IconButton>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!form.$('mapId').error}>
                <TextField {...form.$('mapId').bind()} variant="outlined" />
                <FormHelperText>{form.$('mapId').error}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!form.$('idNumber').error}>
                <TextField {...form.$('idNumber').bind()} variant="outlined" />
                <FormHelperText>{form.$('idNumber').error}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} offset={{xs: 0, sm: 6}}>
              <FormControl fullWidth error={!!form.$('ownerOrgId').error}>
                <InputLabel variant="outlined">Responsible Agency</InputLabel>
                <Select {...form.$('ownerOrgId').bind()} variant="outlined" label="Responsible Agency">
                  {store.ownerOptions.map(o => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!form.$('startTime').error}>
                <DateTimePicker
                  label="Start Time"
                  value={form.$('startTime').value}
                  onChange={(date) => form.$('startTime').onChange(date)}
                  onAccept={(date) => form.$('startTime').onChange(date)}
                  format="MM/dd/yy HH:mm"
                  slotProps={{
                    textField: {
                      onBlur: form.$('startTime').onBlur,
                      error: form.$('startTime').hasError,
                      helperText: form.$('startTime').error,
                    }
                  }}
                />
                <FormHelperText>{form.$('startTime').error}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!form.$('earlySignInWindow').error} disabled={store.earlySigninDisabled}>
                <InputLabel variant="outlined">Early Sign In Window</InputLabel>
                <Select {...form.$('earlySignInWindow').bind()} variant="outlined" disabled={store.earlySigninDisabled}>
                  {store.earlySignInWindowOptions.map(o => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth error={!!form.$('description').error}>
                <TextField {...form.$('description').bind()} multiline variant="outlined" />
                <FormHelperText>{form.$('description').error}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid container size={12} spacing={1} sx={styles.optionsGrid}>
              <Grid size={{ xs: 12, sm: 6 }}>

                <Grid size={12}>
                  <FormGroup>
                    <FormControlLabel control={<Switch {...form.$('forceStandbyOnly').bind()} color="primary" />} label={form.$('forceStandbyOnly').label} />
                  </FormGroup>
                </Grid>

                {isNew && (
                  <Grid size={12} sx={styles.helperGrid}>
                    <Box>{'DEMO'} will start as a participating unit.</Box>
                  </Grid>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" sx={styles.actionRow} spacing={1}>
                  <Button onClick={() => navigate(-1)}>Cancel</Button>
                  <Button onClick={form.onSubmit} variant="contained">
                    Save {store.type === 'missions' ? 'Mission' : 'Event'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            {/*}
                      </Grid>
        </form>

        <LocationEditDialog
          location={watchLocation ?? undefined}
          open={showLocationEditDialog}
          onSubmit={(location) => {
            setValue('location', location);
          }}
          onClose={() => setShowLocationEditDialog(false)}
        /> */}
          </Grid>
        </form>
      </Paper>
    </ToolbarPage>
  )
})

export default function CreateActivityPage({ type }: { type: 'events'|'missions' }) {
  const activityStore = useActivitiesContext()
  const orgs = useOrganizationsContext()
  const store = useMemo(() => new CreateActivityUiStore(type, activityStore, orgs), [type, activityStore, orgs])
  return (<_CreateActivityPage store={store} />)
}
