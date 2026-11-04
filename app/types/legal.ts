// Enums matching DRF OpenAPI spec
export type StatusEnum = 'PENDING' | 'DECIDED' | 'DISPOSED' | 'TRANSFERRED' | 'CONSIGNED'
export type PartySideEnum = 'PETITIONER' | 'RESPONDENT' | 'STATE'
export type EffectEnum = 'ALLOW' | 'DENY'
export type NatureEnum = 'CIVIL' | 'CRIMINAL'
export type WorkAccessTypeEnum = 'ASSIGNED' | 'PEER' | 'ADMIN' | 'VIEW_ONLY'
export type MarkingActionEnum = 'INITIAL' | 'MARK' | 'MARK_BACK'
export type ProfileStatusEnum = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'ARCHIVED'

// --- Reference & Org Models ---
export interface Appointment {
  appointment_id: string
  title: string
  appointment_code: string | null
  created_at: string
}

export type AppointmentPayload = Pick<Appointment, 'title'> & Partial<Pick<Appointment, 'appointment_code'>>

export interface Rank {
  rank_id: string
  title: string
  abbreviation: string | null
  seniority_index: number
  created_at: string
}

export type RankPayload = Pick<Rank, 'title'> & Partial<Pick<Rank, 'abbreviation' | 'seniority_index'>>

export interface PoliceStation {
  police_station_id: string
  district: string
  name: string
  code: string | null
}

export type PoliceStationPayload = Pick<PoliceStation, 'district' | 'name'> & Partial<Pick<PoliceStation, 'code'>>

export interface Court {
  court_id: string
  district: string
  court_name: string
  presiding_officer: string
  designation: string
  court_room_no: string | null
  is_active: boolean
  created_at: string
}

export type CourtPayload = Pick<Court, 'district' | 'court_name' | 'presiding_officer' | 'designation'> &
  Partial<Pick<Court, 'court_room_no' | 'is_active'>>

export interface Organization {
  organization_id: string
  parent_organization: string | null
  name: string
  code: string
  org_level: number
  is_root: boolean
  is_active: boolean
  created_at: string
  sub_organizations_count: number
}

export type OrganizationPayload = Pick<Organization, 'name' | 'code'> &
  Partial<Pick<Organization, 'parent_organization' | 'is_active'>>

// --- RBAC & Users ---
export interface Permission {
  permission_id: string
  code: string
  module: string
  description: string | null
  created_at: string
}

export type PermissionPayload = Pick<Permission, 'code' | 'module'> & Partial<Pick<Permission, 'description'>>

export interface Role {
  role_id: string
  name: string
  description: string | null
  permissions: Permission[]
  permission_ids: string[]
  created_at: string
}

export type RolePayload = Pick<Role, 'name' | 'permission_ids'> & Partial<Pick<Role, 'description'>>

export interface PermissionOverride {
  override_id: string
  user: string
  permission_code: string
  effect: EffectEnum
  reason: string
  granted_by: string
  expires_at: string | null
  created_at: string
}

export type PermissionOverridePayload = Pick<
  PermissionOverride,
  'user' | 'permission_code' | 'effect' | 'reason' | 'granted_by'
> &
  Partial<Pick<PermissionOverride, 'expires_at'>>

export interface User {
  user_id: string
  username: string
  name: string
  email: string | null
  profile_status: ProfileStatusEnum
  svc_number: string
  rank: string | null
  rank_details: Rank | null
  appointment: string | null
  appointment_details: Appointment | null
  organization: string | null
  organization_details: Organization | null
  role: string | null
  role_details: Role | null
  profile_image: string | null
  is_staff: boolean
  is_active: boolean
  password?: string
  created_at: string
  updated_at: string
}

export interface UserPayload {
  username: string
  name: string
  svc_number: string
  password?: string
  email?: string | null
  profile_status?: ProfileStatusEnum
  rank?: string | null
  appointment?: string | null
  organization?: string | null
  role?: string | null
  is_staff?: boolean
  is_active?: boolean
}

export interface UserChangePasswordPayload {
  old_password?: string
  new_password?: string
  [key: string]: unknown
}

// --- Case Domain Models ---
export interface CaseCategory {
  category_id: string
  nature: NatureEnum
  name: string
  short_code: string | null
}

export type CaseCategoryPayload = Pick<CaseCategory, 'nature' | 'name'> &
  Partial<Pick<CaseCategory, 'short_code'>>

export interface CaseParty {
  party_id: string
  case: string
  party_side: PartySideEnum
  party_name: string
  is_primary_party: boolean
  counsel_name: string | null
  cnic: string | null
  contact_number: string | null
}

export type CasePartyPayload = Pick<CaseParty, 'case' | 'party_side' | 'party_name'> &
  Partial<Pick<CaseParty, 'is_primary_party' | 'counsel_name' | 'cnic' | 'contact_number'>>

export interface CaseProceeding {
  proceeding_id: string
  case: string
  court: string
  court_details: Court
  recorded_by: string | null
  recorded_by_details: User | null
  sr_no: number
  proceeding_date: string
  stage: string
  today_action: string | null
  short_order: string | null
  is_case_decided: boolean
  next_proceeding_date: string | null
  next_stage_purpose: string | null
  created_at: string
}

export type CaseProceedingPayload = Pick<
  CaseProceeding,
  'case' | 'court' | 'proceeding_date' | 'stage'
> &
  Partial<
    Pick<
      CaseProceeding,
      | 'recorded_by'
      | 'sr_no'
      | 'today_action'
      | 'short_order'
      | 'is_case_decided'
      | 'next_proceeding_date'
      | 'next_stage_purpose'
    >
  >

export interface Case {
  case_id: string
  case_number: string
  case_title: string
  court: string
  court_details: Court
  category: string
  category_details: CaseCategory
  managing_organization: string
  managing_organization_details: Organization
  assigned_case_officer: string | null
  assigned_case_officer_details: User | null
  marked_by: string | null
  marked_by_details: User | null
  marked_at: string | null
  marking_remarks: string | null
  institution_number: string | null
  institution_date: string
  police_station: string | null
  police_station_details: PoliceStation | null
  fir_number: string | null
  fir_year: number | null
  offence_sections: string | null
  status: StatusEnum
  decision_date: string | null
  parties: CaseParty[]
  proceedings: CaseProceeding[]

  // Object-level permission & UI metadata (computed by the backend per request user)
  can_work: boolean
  can_mark: boolean
  can_mark_back: boolean
  work_access_type: WorkAccessTypeEnum

  created_at: string
  updated_at: string
}

export interface CaseMarkingHistory {
  history_id: string
  case: string
  from_user: string
  from_user_details: User
  to_user: string
  to_user_details: User
  action: MarkingActionEnum
  remarks: string | null
  created_at: string
}

export interface CaseMarkPayload {
  to_user_id: string
  remarks?: string
}

export interface CaseMarkBackPayload {
  remarks?: string
}

export interface CasePayload {
  case_number: string
  case_title: string
  court: string
  category: string
  managing_organization: string
  institution_date: string
  assigned_case_officer?: string | null
  institution_number?: string | null
  police_station?: string | null
  fir_number?: string | null
  fir_year?: number | null
  offence_sections?: string | null
  status?: StatusEnum
  decision_date?: string | null
}

export interface CaseClosePayload {
  decision_date?: string
  status?: StatusEnum
  short_order?: string
  today_action?: string
  [key: string]: unknown
}

// --- Case Timeline ---
export type CaseTimelineEventType = 'INSTITUTION' | 'PROCEEDING' | 'MARK' | 'MARK_BACK' | 'DECISION'

export interface CaseTimelineEventMetadata {
  // Institution
  court?: string | null
  court_id?: string | null
  category?: string | null
  category_nature?: string | null
  institution_number?: string | null
  managing_organization?: string | null
  police_station?: string | null
  fir_number?: string | null
  fir_year?: number | null
  offence_sections?: string | null

  // Proceeding
  proceeding_id?: string | null
  sr_no?: number | null
  stage?: string | null
  today_action?: string | null
  short_order?: string | null
  next_proceeding_date?: string | null
  next_stage_purpose?: string | null
  is_case_decided?: boolean | null
  court_name?: string | null
  presiding_officer?: string | null

  // Marking
  history_id?: string | null
  action?: MarkingActionEnum | null
  from_user_name?: string | null
  to_user_name?: string | null
  remarks?: string | null

  // Decision
  status?: StatusEnum | null
  decision_date?: string | null

  [key: string]: unknown
}

export interface CaseTimelineEvent {
  id: string
  event_type: CaseTimelineEventType
  title: string
  description: string
  date: string
  timestamp: string
  actor: User | null
  target_user?: User | null
  metadata: CaseTimelineEventMetadata
}


// --- Cause Lists ---
export interface CauseListItem {
  item_id: string
  cause_list: string
  case: string
  case_details: Case
  proceeding: string
  proceeding_details: CaseProceeding
  roster_sr_no: number
  category_heading: string
}

export type CauseListItemPayload = Pick<
  CauseListItem,
  'cause_list' | 'case' | 'proceeding' | 'roster_sr_no' | 'category_heading'
>

export interface CauseList {
  cause_list_id: string
  court: string
  court_details: Court
  cause_list_date: string
  day_of_week: string
  items: CauseListItem[]
  created_at: string
}

export type CauseListPayload = Pick<CauseList, 'court' | 'cause_list_date' | 'day_of_week'>

// --- List Filters ---
export interface CaseFilters {
  search?: string
  status?: StatusEnum
  status__in?: string
  court?: string
  category?: string
  managing_organization?: string
  assigned_case_officer?: string
  police_station?: string
  fir_number?: string
  fir_year?: number
  institution_date_after?: string
  institution_date_before?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface ProceedingFilters {
  search?: string
  case?: string
  court?: string
  is_case_decided?: boolean
  stage?: string
  stage__icontains?: string
  proceeding_date_after?: string
  proceeding_date_before?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface CauseListFilters {
  search?: string
  court?: string
  cause_list_date?: string
  day_of_week?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface CourtFilters {
  search?: string
  district?: string
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

export interface UserFilters {
  search?: string
  organization?: string
  rank?: string
  role?: string
  profile_status?: ProfileStatusEnum
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

export interface OrganizationFilters {
  search?: string
  parent_organization?: string
  is_root?: boolean
  is_active?: boolean
  org_level?: number
  ordering?: string
  page?: number
  page_size?: number
}
