import { CATEGORY_LABELS, PERSON_MAP } from '@/lib/constants'
import type { Leaders, Profile, Category } from '@/types'

interface Props {
  leaders: Leaders
  profiles: Profile[]
}

const CATEGORIES: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

export default function CategoryLeaders({ leaders, profiles }: Props) {
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  return (
    <div className="grid grid-cols-3 gap-2">
      {CATEGORIES.map(cat => {
        const leaderId = leaders[cat]
        const leaderProfile = leaderId ? profileMap[leaderId] : null
        const person = leaderProfile ? PERSON_MAP[leaderProfile.person_id] : null

        return (
          <div key={cat} className="bg-white rounded-xl border border-slate-200 p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">
              {CATEGORY_LABELS[cat]}
            </div>
            {leaderProfile && person ? (
              <>
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: person.colorHex }}
                >
                  {leaderProfile.display_name}
                </div>
                <div className="text-amber-500 text-xs">👑</div>
              </>
            ) : (
              <div className="text-slate-300 text-xs font-medium">Tied</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
