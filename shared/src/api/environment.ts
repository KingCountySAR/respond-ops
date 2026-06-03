import { type ApiResponse, type ClientLogin } from './'

export interface ClientEnvironment {
  readonly orgId: string;
  readonly title: string;
  readonly shortTitle?: string;
  readonly brand: {
    readonly primary: string;
    readonly primaryDark?: string;
  }
}

export interface BootData {
  googleClientId: string;
  environment: ClientEnvironment;
  login?: ClientLogin;
}

export type BootDataResult = ApiResponse<BootData>;
