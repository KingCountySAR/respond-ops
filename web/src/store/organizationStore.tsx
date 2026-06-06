import { OrganizationsResult } from '@shared/api/organization'
import { OrganizationModel } from '@web/model/organizationModel.js'
import { action, autorun, observable, runInAction, toJS } from 'mobx'
import { createContext, useContext } from 'react'

export class OrganizationsStore {
  @observable accessor knownOrgs: OrganizationModel[] = []
  @observable accessor loaded: boolean = false
  @observable accessor loading: boolean = false

  constructor() {
    autorun(() => console.log('Known orgs updated', toJS(this.knownOrgs)))
  }

  @action.bound
  async load(force?: boolean) {
    console.log('orgs loading')
    if (this.loaded && !force) {
      return
    }

    this.loading = true
    try {
      const response = await fetch('/api/organizations')
      const json = await response.json() as OrganizationsResult
      runInAction(() => {
        this.knownOrgs = json.data!.map(o => new OrganizationModel(o))
      })
    } finally {
      runInAction(() => {
        this.loading = false
        this.loaded = true
      })
    }
  }
}


const OrganizationsContextInstance = createContext<OrganizationsStore | null>(null)

export const OrganizationsProvider = ({ store, children }: { store: OrganizationsStore; children: React.ReactNode }) => (
  <OrganizationsContextInstance.Provider value={store}>{children}</OrganizationsContextInstance.Provider>
)

export const useOrganizationsContext = () => {
  const OrganizationsContext = useContext(OrganizationsContextInstance)

  if (!OrganizationsContext) {
    throw new Error('useOrganizationsContext must be used within <OrganizationsProvider>')
  }

  return OrganizationsContext
}
