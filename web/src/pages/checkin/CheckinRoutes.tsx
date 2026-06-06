import { lazy } from 'react'

import ActivityPage from './ActivityPage'

const CreateActivityPage = lazy(() => import ('./CreateActivityPage'))

export function buildCheckinRoutes() {
  return [
    { path: '/missions/new', element: (<CreateActivityPage type={'missions'}/>) },
    { path: '/missions/:activityId', element: (<ActivityPage />) },
    { path: '/events/new', element: (<CreateActivityPage type={'events'}/>) },
    { path: '/events/:activityId', element: (<ActivityPage />) },
  ]
}