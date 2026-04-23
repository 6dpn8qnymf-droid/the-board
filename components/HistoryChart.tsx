'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PERSONS, CATEGORY_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { MetricSnapshot, Profile, Category } from '@/types'
import { format } from 'date-fns'

interface Props {
  profiles: Profile[]
  snapshots: MetricSnapshot[]
}

const CATEGORIES: Category[] = ['aum', 'fee_revenue_ytd', 'contributions_ytd']

export default function HistoryChart({ profiles, snapshots }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('aum')
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  // Build chart data: one point per snapshot, keyed by date
  const allDates = [...new Set(snapshots.map(s => s.created_at.split('T')[0]))].sort()

  // Latest snapshot per user per date
  const chartData = allDates.map(date => {
    const point: Record<string, number | string> = { date }
    for (const profile of profiles) {
      const daySnaps = snapshots.filter(
        s => s.user_id === profile.id && s.created_at.split('T')[0] <= date
      )
      if (daySnaps.length > 0) {
        const latest = daySnaps[daySnaps.length - 1]
        point[profile.person_id] = latest[activeCategory]
      }
    }
    return point
  })

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400">
        <div className="text-4xl mb-3">📈</div>
        <p className="text-sm">No data yet. Post your first update!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tickFormatter={d => format(new Date(d + 'T12:00:00'), 'M/d')}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => formatCurrency(v as number)}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value, false), name]}
              labelFormatter={d => format(new Date(d + 'T12:00:00'), 'MMM d, yyyy')}
              contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
            />
            <Legend
              formatter={(value) => {
                const person = PERSONS.find(p => p.id === value)
                return person?.displayName ?? value
              }}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
            {profiles.map(profile => {
              const person = PERSONS.find(p => p.id === profile.person_id)
              if (!person) return null
              return (
                <Line
                  key={profile.person_id}
                  type="monotone"
                  dataKey={profile.person_id}
                  name={profile.person_id}
                  stroke={person.colorHex}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: person.colorHex }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
