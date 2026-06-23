import { Activity, ActivityType, OrganizationStatus, ParticipantStatus, ParticipatingOrg } from '@shared/api/activity'
import { ActivityModel } from '@web/model/activityModel.js'
import { ActivitiesStore } from '@web/store/activitiesStore'
import { computed, makeObservable } from 'mobx'

const MAX_COMPLETED_ACTIVITIES_VISIBLE = 3
const COMPLETED_ACTIVITY_VISIBLE_WINDOW = 3 * 24 * 60 * 60 * 1000

export type ActivityAction = { id: string; label: string; newStatus: ParticipantStatus }
export type ActivityDetailRow = { type: 'text'; label: string; value: string } | { type: 'time'; label: string; time: number }
export type ActivityRowsOptions = { showDemNumber?: boolean; showActiveResponders?: boolean }
export type ActivityOrgChip = {
  id: string
  label: string
  color: 'success' | 'warning' | 'default'
}

const ACTIVITY_PATH_BY_TYPE: Record<ActivityType, string> = {
  missions: '/missions/new',
  events: '/events/new',
}

const SIGN_IN: ActivityAction = { id: 'signin', label: 'Sign In', newStatus: ParticipantStatus.SignedIn }
const STAND_BY: ActivityAction = { id: 'standby', label: 'Stand By', newStatus: ParticipantStatus.Standby }
const IN_TOWN: ActivityAction = { id: 'remote', label: 'In Town', newStatus: ParticipantStatus.Remote }
const STAND_DOWN: ActivityAction = { id: 'standdown', label: 'Stand Down', newStatus: ParticipantStatus.SignedOut }
const SIGN_OUT: ActivityAction = { id: 'signout', label: 'Sign Out', newStatus: ParticipantStatus.SignedOut }
const ARRIVE_BASE: ActivityAction = { id: 'arrive', label: 'Arrive Base', newStatus: ParticipantStatus.Available }
const TURN_AROUND: ActivityAction = { id: 'turnaround', label: 'Turn Around', newStatus: ParticipantStatus.Demobilized }
const DEPART_BASE: ActivityAction = { id: 'depart', label: 'Depart Base', newStatus: ParticipantStatus.Demobilized }
const ASSIGNED: ActivityAction = { id: 'assigned', label: 'Assigned', newStatus: ParticipantStatus.Assigned }
const AVAILABLE: ActivityAction = { id: 'available', label: 'Available', newStatus: ParticipantStatus.Available }

const OPEN_ACTIVITY_ACTIONS_BY_STATUS: Record<ParticipantStatus, ActivityAction[]> = {
  [ParticipantStatus.NotResponding]: [SIGN_IN, STAND_BY, IN_TOWN],
  [ParticipantStatus.Remote]: [SIGN_OUT],
  [ParticipantStatus.Standby]: [SIGN_IN, STAND_DOWN],
  [ParticipantStatus.SignedIn]: [ARRIVE_BASE, TURN_AROUND, SIGN_OUT],
  [ParticipantStatus.SignedOut]: [SIGN_IN, STAND_BY, IN_TOWN],
  [ParticipantStatus.Available]: [DEPART_BASE, ASSIGNED],
  [ParticipantStatus.Assigned]: [AVAILABLE],
  [ParticipantStatus.Demobilized]: [SIGN_OUT, SIGN_IN, ARRIVE_BASE],
}

function getCurrentTime() {
  return new Date().getTime()
}

/**
 * Order missions newest-first and events oldest-first for their respective list displays.
 */
function sortActivitiesForDisplay(a: Activity, b: Activity) {
  const newestFirst = a.isMission
  const startTimeDelta = a.startTime - b.startTime

  if (startTimeDelta === 0) return 0
  return newestFirst ? -startTimeDelta : startTimeDelta
}

/**
 * The first timeline entry represents the participant's latest status.
 */
function getCurrentParticipantStatus({ timeline }: { timeline: { status: ParticipantStatus }[] }) {
  return timeline[0]?.status
}

/**
 * Count any known status except not responding or signed out as active.
 */
function isParticipantStatusActive(status: ParticipantStatus | undefined) {
  return status !== undefined
    && status !== ParticipantStatus.NotResponding
    && status !== ParticipantStatus.SignedOut
}

/**
 * Standby users are active but not considered responding.
 */
function isResponding(status: ParticipantStatus | undefined) {
  return isParticipantStatusActive(status) && status !== ParticipantStatus.Standby
}

/**
 * Count participants whose latest status is active for display summaries.
 */
function getActiveParticipantCount(activity: Activity) {
  return Object.values(activity.participants).filter(participant => isParticipantStatusActive(getCurrentParticipantStatus(participant))).length
}

/**
 * Compare against the current clock so status labels update over time.
 */
function isFuture(time: number) {
  return time > getCurrentTime()
}

/**
 * Activities with an end time are treated as closed/completed.
 */
function isActivityComplete(activity: Activity) {
  return !!activity.endTime
}

/**
 * A started activity is open-ended and has reached its start time.
 */
function isActivityStarted(activity: Activity) {
  return !isActivityComplete(activity) && !isFuture(activity.startTime)
}

/**
 * Keep only recently started completed activities, sorted for display and capped.
 */
function getRecentCompletedActivities(activities: ActivityModel[]) {
  const oldestVisibleStartTime = getCurrentTime() - COMPLETED_ACTIVITY_VISIBLE_WINDOW

  return activities
    .filter(activity => isActivityComplete(activity) && activity.startTime > oldestVisibleStartTime)
    .sort(sortActivitiesForDisplay)
    .slice(0, MAX_COMPLETED_ACTIVITIES_VISIBLE)
}

/**
 * Show open activities first, then append a short tail of recent completed ones.
 */
function filterActivitiesForDisplay(activities: ActivityModel[]) {
  const activeActivities = activities
    .filter(activity => !isActivityComplete(activity))
    .sort(sortActivitiesForDisplay)

  return activeActivities.concat(getRecentCompletedActivities(activities))
}

/**
 * Convert the org's latest response status into the chip color shown in lists.
 */
function getOrgChipColor(org: ParticipatingOrg) {
  switch (org.timeline[0]?.status) {
    case OrganizationStatus.Responding:
      return 'success'
    case OrganizationStatus.Standby:
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * Return fresh action objects so callers can safely decorate them per render.
 */
function cloneActions(actions: ActivityAction[]) {
  return actions.map(action => ({ ...action }))
}

/**
 * Toggle between standing by and standing down when only standby actions are allowed.
 */
function getStandbyOnlyActions(status: ParticipantStatus | undefined) {
  return cloneActions(status === ParticipantStatus.Standby ? [STAND_DOWN] : [STAND_BY])
}

/**
 * Choose valid actions from the user's current status, defaulting to not responding.
 */
function getOpenActivityActions(status: ParticipantStatus | undefined) {
  return cloneActions(OPEN_ACTIVITY_ACTIONS_BY_STATUS[status ?? ParticipantStatus.NotResponding])
}

/**
 * Count active participants that belong to the given organization.
 */
function getOrgResponderCount(activity: Activity, organizationId: string) {
  return Object.values(activity.participants).filter(participant => (
    participant.organizationId === organizationId
    && isParticipantStatusActive(getCurrentParticipantStatus(participant))
  )).length
}

/**
 * Append the responder count only when there are active responders to show.
 */
function formatOrgChipLabel(org: ParticipatingOrg, responderCount: number) {
  const name = org.rosterName ?? org.title
  return responderCount ? `${name} ${responderCount}` : name
}

export class ActivitiesUiStore {
  constructor(private readonly activitiesStore: ActivitiesStore) {
    makeObservable(this)
  }

  /**
   * Reuse the activity store's participant-specific current activity calculation.
   */
  @computed
  get myCurrentActivities() {
    return this.activitiesStore.myCurrentActivities
  }

  /**
   * Apply display filtering and ordering to mission activities.
   */
  @computed
  get missions() {
    return filterActivitiesForDisplay(this.activitiesStore.activeMissions)
  }

  /**
   * Apply display filtering and ordering to event activities.
   */
  @computed
  get events() {
    return filterActivitiesForDisplay(this.activitiesStore.activeEvents)
  }

  /**
   * Build a lookup so activity cards can quickly read the user's current status.
   */
  @computed
  get currentParticipantStatusByActivityId() {
    return this.myCurrentActivities.reduce<Record<string, ParticipantStatus>>((statusByActivityId, current) => {
      statusByActivityId[current.activity.id] = current.status.status
      return statusByActivityId
    }, {})
  }

  /**
   * Enable mission creation only when at least one org can create missions.
   */
  @computed
  get canCreateMissions() {
    return this.activitiesStore.missionCapableOrgs.length > 0
  }

  /**
   * Enable event creation only when at least one org can create events.
   */
  @computed
  get canCreateEvents() {
    return this.activitiesStore.eventCapableOrgs.length > 0
  }

  /**
   * Route to the activity type namespace before the activity id.
   */
  getActivityPath(activity: Activity) {
    const activityType: ActivityType = activity.isMission ? 'missions' : 'events'
    return `/${activityType}/${activity.id}`
  }

  /**
   * Resolve the configured creation path for the requested activity type.
   */
  getNewActivityPath(type: ActivityType) {
    return ACTIVITY_PATH_BY_TYPE[type]
  }

  /**
   * Active means not completed from the UI's perspective.
   */
  isActivityActive(activity: Activity) {
    return !isActivityComplete(activity)
  }

  /**
   * Respect the early sign-in window before allowing users to act on an activity.
   */
  isActivityOpen(activity: Activity) {
    const isWithinEarlySignInWindow = activity.earlySignInWindow
      ? !isFuture(activity.startTime - activity.earlySignInWindow)
      : true

    return this.isActivityActive(activity) && isWithinEarlySignInWindow
  }

  /**
   * Convert activity timing into the user-facing status label.
   */
  getActivityStatus(activity: Activity) {
    if (isActivityComplete(activity)) return 'Closed'
    if (isActivityStarted(activity)) return 'In Progress'
    if (this.isActivityOpen(activity)) return 'Open For Sign In'
    return 'Not Started'
  }

  /**
   * Closed or forced-standby activities offer only standby-related actions.
   */
  getActivityActions(activity: Activity, status?: ParticipantStatus): ActivityAction[] {
    if (!this.isActivityOpen(activity) || (activity.forceStandbyOnly && !isResponding(status))) {
      return getStandbyOnlyActions(status)
    }

    return getOpenActivityActions(status)
  }

  /**
   * Compose the detail rows conditionally based on caller display options and timing.
   */
  getActivityRows(activity: Activity, { showDemNumber = true, showActiveResponders = true }: ActivityRowsOptions = {}): ActivityDetailRow[] {
    const rows: ActivityDetailRow[] = [
      { type: 'text', label: 'Location', value: activity.location.title },
    ]

    if (showDemNumber) {
      rows.push({ type: 'text', label: 'State #', value: activity.idNumber })
    }

    rows.push({ type: 'text', label: activity.isMission ? 'Mission Status' : 'Status', value: this.getActivityStatus(activity) })

    if (isFuture(activity.startTime)) {
      rows.push({ type: 'time', label: 'Start Time', time: activity.startTime })
    }

    if (showActiveResponders) {
      rows.push({ type: 'text', label: 'Active Responders', value: getActiveParticipantCount(activity).toString() })
    }

    return rows
  }

  /**
   * Map participating orgs into chip props with responder counts and status colors.
   */
  getParticipatingOrgChips(activity: Activity): ActivityOrgChip[] {
    return Object.entries(activity.organizations ?? {}).map(([id, org]) => {
      const responderCount = getOrgResponderCount(activity, id)

      return {
        id,
        label: formatOrgChipLabel(org, responderCount),
        color: getOrgChipColor(org),
      }
    })
  }

  updateMyStatus = () => {
    // Placeholder entry point for status updates.
  }
}
