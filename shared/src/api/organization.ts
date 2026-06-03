import { ApiResponse } from './'

export interface Organization {
  id: string,
  title: string,
  rosterTitle?: string,
  canCreateMissions: boolean;
  canCreateEvents: boolean;
}

export type OrganizationsResult = ApiResponse<Organization[]>;
