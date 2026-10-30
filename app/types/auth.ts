import type { Role, ProfileStatusEnum } from '~/types/legal'

export interface TokenPair {
  access: string
  refresh: string
}

export interface Credentials {
  username: string
  password: string
}

/** Mirrors users.serializers.UserSerializer (read shape) */
export interface AuthUser {
  user_id: string
  username: string
  name: string
  profile_status: ProfileStatusEnum
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
