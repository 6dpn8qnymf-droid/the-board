import type { Category, Leaders, MetricSnapshot } from '@/types'

export function formatCurrency(value: number, compact = true): string {
  if (!compact) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  }
  if (Math.abs(value) >= 1_000_000) {
    return '$' + (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  }
  if (Math.abs(value) >= 1_000) {
    return '$' + (value / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'K'
  }
  return '$' + value.toFixed(0)
}

export function formatDelta(delta: number): string {
  const prefix = delta >= 0 ? '+' : ''
  return prefix + formatCurrency(delta)
}

export function computeLeaders(snapshots: Array<{ user_id: string } & Pick<MetricSnapshot, 'aum' | 'fee_revenue_ytd' | 'contributions_ytd'>>): Leaders {
  const leaders: Leaders = { aum: null, fee_revenue_ytd: null, contributions_ytd: null }
  const categories: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

  for (const cat of categories) {
    let maxVal = -1
    let maxId: string | null = null
    let tied = false

    for (const s of snapshots) {
      const val = s[cat]
      if (val > maxVal) {
        maxVal = val
        maxId = s.user_id
        tied = false
      } else if (val === maxVal && val > 0) {
        tied = true
      }
    }
    leaders[cat] = tied ? null : (maxVal > 0 ? maxId : null)
  }

  return leaders
}

export function getTripleCrown(leaders: Leaders): string | null {
  if (
    leaders.aum !== null &&
    leaders.aum === leaders.fee_revenue_ytd &&
    leaders.aum === leaders.contributions_ytd
  ) {
    return leaders.aum
  }
  return null
}

export function getCategoryValue(snapshot: MetricSnapshot, cat: Category): number {
  return snapshot[cat]
}

export function getCategoryDelta(snapshot: MetricSnapshot, cat: Category): number {
  if (cat === 'aum') return snapshot.aum_delta
  if (cat === 'fee_revenue_ytd') return snapshot.fee_revenue_delta
  return snapshot.contributions_delta
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
