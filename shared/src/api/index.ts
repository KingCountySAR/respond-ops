export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: string;
};

export interface ClientLogin {
  email: string
  name: string
  picture?: string
  memberId?: string
  siteAdmin?: boolean;
}

export interface MemberInfo {
  id: string;
  firstname: string;
  lastname: string;
  groups: string[];
  email?: string;
  mobilephone?: string;
}

export type MemberListResult = ApiResponse<MemberInfo[]>;
