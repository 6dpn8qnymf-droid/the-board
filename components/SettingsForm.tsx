'use client'

import { useState, useTransition } from 'react'
import { updateMilestoneThresholds } from '@/app/actions/settings'
import { formatCurrency } from '@/lib/utils'
import type { MilestoneThresholds } from '@/types'

interface Props {
  thresholds: MilestoneThresholds
}

export default function SettingsForm({ thresholds }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [values, setValues] = useState({
    aum: String(thresholds.aum),
    fee_revenue_ytd: String(thresholds.fee_revenue_ytd),
    contributions_ytd: String(thresholds.contributions_ytd),
  })

  function set(key: keyof typeof values, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    const parsed = {
      aum: parseFloat(values.aum),
      fee_revenue_ytd: parseFloat(values.fee_revenue_ytd),
      contributions_ytd: parseFloat(values.contributions_ytd),
    }
    if (Object.values(parsed).some(isNaN)) return

    startTransition(async () => {
      await updateMilestoneThresholds(parsed)
      setSaved(true)
    })
  }

  const fields: Array<{ key: keyof typeof values; label: string }> = [
    { key: 'aum', label: 'AUM (every $X)' },
    { key: 'fee_revenue_ytd', label: 'Fee Revenue (every $X)' },
    { key: 'contributions_ytd', label: 'Contributions (every $X)' },
  ]

  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs text-slate-500 mb-1">{label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              value={values[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
      >
        {saved ? '✓ Saved' : isPending ? 'Saving…' : 'Save Thresholds'}
      </button>
    </div>
  )
}
