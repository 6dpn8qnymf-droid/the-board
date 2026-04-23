import type { PersonConfig, Category, MilestoneThresholds } from '@/types'

export const PERSONS: PersonConfig[] = [
  { id: 'big-e',     displayName: 'Big E',      colorHex: '#DC2626', colorClass: 'red'   },
  { id: 'ao',        displayName: 'AO',          colorHex: '#0D9488', colorClass: 'teal'  },
  { id: 'sethy-boi', displayName: 'Sethy Boi',   colorHex: '#16A34A', colorClass: 'green' },
]

export const PERSON_MAP = Object.fromEntries(PERSONS.map(p => [p.id, p]))

export const CATEGORIES: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

export const CATEGORY_LABELS: Record<Category, string> = {
  aum: 'AUM',
  fee_revenue_ytd: 'Fee Revenue',
  contributions_ytd: 'Contributions',
}

export const DELTA_COLUMNS: Record<Category, string> = {
  aum: 'aum_delta',
  fee_revenue_ytd: 'fee_revenue_delta',
  contributions_ytd: 'contributions_delta',
}

export const DEFAULT_THRESHOLDS: MilestoneThresholds = {
  aum: 500_000,
  fee_revenue_ytd: 2_000,
  contributions_ytd: 50_000,
}
