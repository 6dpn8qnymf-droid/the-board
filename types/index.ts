export type PersonId = 'big-e' | 'ao' | 'sethy-boi'
export type Category = 'aum' | 'fee_revenue_ytd' | 'contributions_ytd'
export type EventType = 'update' | 'lead_change' | 'milestone' | 'personal_best' | 'triple_crown'
export type InputMethod = 'total' | 'delta'

export interface PersonConfig {
  id: PersonId
  displayName: string
  colorHex: string
  colorClass: string // Tailwind prefix: 'red' | 'teal' | 'green'
}

export interface Profile {
  id: string
  person_id: PersonId
  display_name: string
  color_hex: string
  created_at: string
}

export interface MetricSnapshot {
  id: string
  user_id: string
  aum: number
  fee_revenue_ytd: number
  contributions_ytd: number
  aum_delta: number
  fee_revenue_delta: number
  contributions_delta: number
  note: string | null
  created_at: string
}

export interface ActivityEvent {
  id: string
  triggered_by: string
  event_type: EventType
  category: Category | null
  payload: Record<string, unknown>
  created_at: string
  profile?: Profile
}

export interface Leaders {
  aum: string | null
  fee_revenue_ytd: string | null
  contributions_ytd: string | null
}

export interface MilestoneThresholds {
  aum: number
  fee_revenue_ytd: number
  contributions_ytd: number
}

export interface CurrentStandings {
  profile: Profile
  snapshot: MetricSnapshot | null
}

export interface MetricInput {
  value: number
  method: InputMethod
}

export interface SnapshotInput {
  aum?: MetricInput
  fee_revenue_ytd?: MetricInput
  contributions_ytd?: MetricInput
  note?: string
}
