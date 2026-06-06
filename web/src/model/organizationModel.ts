import { Organization } from '@shared/api/organization'

export class OrganizationModel implements Organization {
  readonly id!: string
  readonly title!: string
  readonly rosterTitle?: string | undefined
  readonly canCreateMissions!: boolean
  readonly canCreateEvents!: boolean

  constructor(api: Organization) {
    Object.assign(this, api)
  }
}
