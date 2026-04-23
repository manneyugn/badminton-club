'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; elo: number }[]
}

export default function EloChart({ data }: Props) {
  const min = Math.min(...data.map(d => d.elo))
  const max = Math.max(...data.map(d => d.elo))
  const pad = 30

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false}
          interval="preserveStartEnd" />
        <YAxis domain={[min - pad, max + pad]} tick={{ fontSize: 10, fill: '#888' }}
          tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#888' }}
          itemStyle={{ color: '#22c55e' }}
          formatter={(v) => [typeof v === 'number' ? Math.round(v) : v, 'ELO']} />
        <Line type="monotone" dataKey="elo" stroke="#22c55e" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
