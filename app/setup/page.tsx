'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PERSONS } from '@/lib/constants'
import type { PersonId } from '@/types'

export default function SetupPage() {
  const router = useRouter()
  const [takenIds, setTakenIds] = useState<PersonId[]>([])
  const [selected, setSelected] = useState<PersonId | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function loadTaken() {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('person_id')
      setTakenIds((data ?? []).map(r => r.person_id as PersonId))
      setChecking(false)
    }
    loadTaken()
  }, [])

  async function claimIdentity() {
    if (!selected) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const person = PERSONS.find(p => p.id === selected)!
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      person_id: selected,
      display_name: person.displayName,
      color_hex: person.colorHex,
    })

    if (error) {
      alert('That identity was just claimed — please pick another.')
      setTakenIds(t => [...t, selected])
      setSelected(null)
      setLoading(false)
      return
    }

    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-slate-900">Who are you?</h1>
          <p className="mt-2 text-slate-500 text-sm">Pick your identity. This can&apos;t be changed later.</p>
        </div>

        <div className="space-y-3">
          {PERSONS.map(person => {
            const taken = takenIds.includes(person.id)
            const isSelected = selected === person.id
            return (
              <button
                key={person.id}
                onClick={() => !taken && setSelected(person.id)}
                disabled={taken}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${
                  taken
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                    : isSelected
                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white active:scale-98'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: person.colorHex }}
                />
                <div className="text-left">
                  <div className="font-semibold text-slate-900">{person.displayName}</div>
                  {taken && <div className="text-xs text-slate-400">Already claimed</div>}
                </div>
                {isSelected && (
                  <div className="ml-auto text-slate-900 text-lg">✓</div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={claimIdentity}
          disabled={!selected || loading}
          className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-base disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? 'Claiming…' : "That's me"}
        </button>
      </div>
    </div>
  )
}
