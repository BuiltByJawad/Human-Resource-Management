export type LoginHighlight = {
  title: string;
  description: string;
};

export interface LoginBranding {
  siteName: string;
  tagline?: string | null;
  heroTitle: string;
  heroSubtitle: string;
  highlights: LoginHighlight[];
  logoUrl?: string | null;
  faviconUrl?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
}

export interface AuthUserPayload {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  avatarUrl?: string | null;
  organizationId?: string | null;
  department?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  emergencyContact?: unknown;
  employee?: unknown;
  status?: string;
  permissions?: string[];
  token?: string | null;
  refreshToken?: string | null;
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user?: AuthUserPayload | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  permissions?: string[];
  [key: string]: unknown;
}

export interface RefreshPayload {
  refreshToken?: string | null;
  rememberMe?: boolean;
}

export interface RefreshResponse {
  ok: boolean;
  data?: LoginResponse | null;
}

export interface CurrentUser {
  id: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  avatarUrl?: string | null
  permissions?: string[]
  employee?: {
    id: string
  }
}
