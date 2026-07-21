import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const STAGE_DATA = [
  { stage: 'Prospect', key: 'prospecting', color: '#818cf8' },
  { stage: 'Qualify', key: 'qualification', color: '#6366f1' },
  { stage: 'Proposal', key: 'proposal', color: '#4f46e5' },
  { stage: 'Negotiate', key: 'negotiation', color: '#f59e0b' },
  { stage: 'Won', key: 'closed_won', color: '#10b981' },
  { stage: 'Lost', key: 'closed_lost', color: '#ef4444' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-lg">
        <p className="text-gray-900 font-semibold text-xs mb-1">{label}</p>
        <p className="text-indigo-600 text-xs">{payload[0]?.value} deals</p>
        <p className="text-gray-400 text-xs">${payload[0]?.payload?.value}k value</p>
      </div>
    )
  }
  return null
}

export default function PipelineChart({ deals = [] }) {
  const data = STAGE_DATA.map(({ stage, key, color }) => {
    const stageDeals = deals.filter((d) => d.stage === key)
    return {
      stage,
      deals: stageDeals.length,
      value: Math.round(
        stageDeals.reduce((s, d) => s + Number(d.value || 0), 0) / 1000
      ),
      color,
    }
  })

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-semibold text-sm">Pipeline by Stage</h2>
        <div className="flex items-center gap-3">
          {STAGE_DATA.map(({ stage, color }) => (
            <div key={stage} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-gray-400">{stage}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="deals" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}