'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PERSON_MAP, CATEGORY_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { submitSnapshot } from '@/app/actions/snapshot'
import type { Profile, MetricSnapshot, Category, InputMethod, SnapshotInput } from '@/types'

interface Props {
  profile: Profile
  prevSnapshot: MetricSnapshot | null
}

interface MetricState {
  enabled: boolean
  method: InputMethod
  value: string
}

const CATEGORIES: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

const CATEGORY_HINTS: Record<Category, string> = {
  aum: 'e.g. 3500000',
  fee_revenue_ytd: 'e.g. 15000',
  contributions_ytd: 'e.g. 250000',
}

function getPrevValue(snapshot: MetricSnapshot | null, cat: Category): number {
  if (!snapshot) return 0
  if (cat === 'aum') return snapshot.aum
  if (cat === 'fee_revenue_ytd') return snapshot.fee_revenue_ytd
  return snapshot.contributions_ytd
}

export default function UpdateForm({ profile, prevSnapshot }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [note, setNote] = useState('')

  const [metrics, setMetrics] = useState<Record<Category, MetricState>>({
    aum: { enabled: false, method: 'delta', value: '' },
    fee_revenue_ytd: { enabled: false, method: 'delta', value: '' },
    contributions_ytd: { enabled: false, method: 'delta', value: '' },
  })

  const person = PERSON_MAP[profile.person_id]
  const anyEnabled = CATEGORIES.some(c => metrics[c].enabled)

  function setMetric(cat: Category, patch: Partial<MetricState>) {
    setMetrics(prev => ({ ...prev, [cat]: { ...prev[cat], ...patch } }))
  }

  function getPreview(cat: Category): string | null {
    const m = metrics[cat]
    const raw = parseFloat(m.value.replace(/,/g, ''))
    if (isNaN(raw) || raw === 0) return null
    const prev = getPrevValue(prevSnapshot, cat)
    if (m.method === 'total') {
      const delta = raw - prev
      return `${formatCurrency(raw)} (${delta >= 0 ? '+' : ''}${formatCurrency(delta)})`
    } else {
      const newTotal = prev + raw
      return `New total: ${formatCurrency(newTotal)}`
    }
  }

  function handleSubmit() {
    const input: SnapshotInput = { note: note || undefined }

    for (const cat of CATEGORIES) {
      const m = metrics[cat]
      if (!m.enabled) continue
      const val = parseFloat(m.value.replace(/,/g, ''))
      if (isNaN(val)) continue
      input[cat] = { value: val, method: m.method }
    }

    setError('')
    startTransition(async () => {
      const result = await submitSnapshot(input)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/leaderboard'), 1200)
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-5xl">✅</div>
        <p className="font-semibold text-slate-900">Update posted!</p>
        <p className="text-sm text-slate-400">Heading back to the board…</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map(cat => {
        const m = metrics[cat]
        const prev = getPrevValue(prevSnapshot, cat)
        const preview = getPreview(cat)

        return (
          <div
            key={cat}
            className="bg-white rounded-2xl border-2 overflow-hidden transition-all"
            style={{ borderColor: m.enabled ? person.colorHex : '#E2E8F0' }}
          >
            {/* Metric header / toggle */}
            <button
              onClick={() => setMetric(cat, { enabled: !m.enabled })}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900">{CATEGORY_LABELS[cat]}</div>
                {prev > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5">Current: {formatCurrency(prev)}</div>
                )}
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative ${m.enabled ? '' : 'bg-slate-200'}`}
                style={m.enabled ? { backgroundColor: person.colorHex } : {}}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${m.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </button>

            {/* Expanded input */}
            {m.enabled && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                {/* Method toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  {(['delta', 'total'] as InputMethod[]).map(method => (
                    <button
                      key={method}
                      onClick={() => setMetric(cat, { method, value: '' })}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        m.method === method
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      {method === 'delta' ? '+ Change' : 'New Total'}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    {m.method === 'delta' ? '+$' : '$'}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={m.value}
                    onChange={e => setMetric(cat, { value: e.target.value })}
                    placeholder={CATEGORY_HINTS[cat]}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 placeholder:text-slate-300"
                    style={{ '--tw-ring-color': person.colorHex } as React.CSSProperties}
                  />
                </div>

                {/* Preview */}
                {preview && (
                  <p className="text-sm font-medium" style={{ color: person.colorHex }}>
                    → {preview}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Note */}
      {anyEnabled && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 px-1">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!anyEnabled || isPending}
        className="w-full py-4 rounded-2xl font-semibold text-white text-base disabled:opacity-40 active:scale-95 transition-transform"
        style={{ backgroundColor: person.colorHex }}
      >
        {isPending ? 'Posting…' : 'Post Update'}
      </button>
    </div>
  )
}
