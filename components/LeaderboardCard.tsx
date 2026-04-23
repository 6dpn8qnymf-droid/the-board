import Link from 'next/link'
import { CATEGORY_LABELS, PERSON_MAP } from '@/lib/constants'
import { formatCurrency, formatDelta } from '@/lib/utils'
import type { Profile, MetricSnapshot, Leaders, Category } from '@/types'

interface Props {
  profile: Profile
  snapshot: MetricSnapshot | null
  leaders: Leaders
  isMe: boolean
}

const CATEGORIES: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

function CrownIcon() {
  return <span className="text-amber-500 text-sm leading-none">👑</span>
}

export default function LeaderboardCard({ profile, snapshot, leaders, isMe }: Props) {
  const person = PERSON_MAP[profile.person_id]

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${isMe ? 'shadow-md' : ''}`}
      style={{ borderColor: person.colorHex }}
    >
      {/* Card header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: person.colorHex + '12' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: person.colorHex }}
          >
            {profile.display_name[0]}
          </div>
          <span className="font-semibold text-slate-900">{profile.display_name}</span>
          {isMe && <span className="text-xs text-slate-400 font-normal">(you)</span>}
        </div>

        {isMe && (
          <Link
            href="/update"
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
            style={{ backgroundColor: person.colorHex }}
          >
            Update ↑
          </Link>
        )}
      </div>

      {/* Metrics */}
      <div className="px-4 py-3 divide-y divide-slate-100">
        {CATEGORIES.map(cat => {
          const value = snapshot?.[cat] ?? null
          const delta = snapshot ? (
            cat === 'aum' ? snapshot.aum_delta :
            cat === 'fee_revenue_ytd' ? snapshot.fee_revenue_delta :
            snapshot.contributions_delta
          ) : null
          const isLeader = leaders[cat] === profile.id

          return (
            <div key={cat} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className="text-sm text-slate-500 w-28">{CATEGORY_LABELS[cat]}</span>
              <div className="flex items-center gap-2">
                {isLeader && <CrownIcon />}
                <div className="text-right">
                  {value !== null ? (
                    <>
                      <div className="font-semibold text-slate-900">{formatCurrency(value)}</div>
                      {delta !== null && delta !== 0 && (
                        <div className={`text-xs ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatDelta(delta)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-300 font-medium">—</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
