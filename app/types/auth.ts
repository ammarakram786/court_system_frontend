export interface TokenPair {
  access: string
  refresh: string
}

export interface Credentials {
  username: string
  password: string
}

export interface Permission {
  permission_id: string
  code: string
  module: string
  description: string | null
  created_at: string
}

export interface Role {
  role_id: string
  name: string
  description: string | null
  permissions: Permission[]
  created_at: string
}

export type ProfileStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'ARCHIVED'

/** Mirrors users.serializers.UserSerializer (read shape) */
export interface AuthUser {
  user_id: string
  username: string
  name: string
  profile_status: ProfileStatus
  svc_number: string
  rank: string | null
  rank_details: { rank_id: string, title: string, abbreviation: string, seniority_index: number } | null
  appointment: string | null
  appointment_details: { appointment_id: string, title: string, appointment_code: string } | null
  organization: string | null
  organization_details: Record<string, unknown> | null
  role: string | null
  role_details: Role | null
  email?: string | null
  profile_image: string | null
  is_staff: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
