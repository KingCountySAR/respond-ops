import { loadStandardData } from '@server/test/dataLoader.js'
import { getTestDb } from '@server/test/setup.js'

import { ActivityService } from '../activityService.js'
import { OrganizationService } from '../organizationService.js'
describe('the activity service', () => {
  it('does work', async () => {
    await loadStandardData(getTestDb())
    const model = new ActivityService({} as OrganizationService, getTestDb)
    await model.reload(true)
    expect(await model.getActiveVisibleToOrgs(['3'])).toHaveLength(0)
    console.log(await model.getActiveVisibleToOrgs(['1','2']))
  })
})