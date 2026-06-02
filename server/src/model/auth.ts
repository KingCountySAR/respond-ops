import { ClientLogin } from '@shared';

export interface SessionLogin extends ClientLogin {
  id: string;
  orgId: string;
  myOrgIds: string[];
}
