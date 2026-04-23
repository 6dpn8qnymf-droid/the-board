import { PERSON_MAP } from '@/lib/constants'
import type { Profile } from '@/types'

interface Props {
  profile: Profile
}

export default function TripleCrownBanner({ profile }: Props) {
  const person = PERSON_MAP[profile.person_id]

  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 p-4 flex items-center gap-3 shadow-sm">
      <div className="text-3xl">👑</div>
      <div>
        <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Triple Crown</div>
        <div className="font-bold text-amber-900 text-base">
          {profile.display_name} leads all three categories
        </div>
      </div>
    </div>
  )
}
