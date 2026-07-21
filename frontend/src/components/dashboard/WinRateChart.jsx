import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function WinRateChart({ deals = [] }) {
  const won = deals.filter((d) => d.stage === 'closed_won').length
  const lost = deals.filter((d) => d.stage === 'closed_lost').length
  const active = deals.filter(
    (d) => !['closed_won', 'closed_lost'].includes(d.stage)
  ).length

  const data = [
    { name: 'Won', value: won || 0, color: '#10b981' },
    { name: 'Lost', value: lost || 0, color: '#ef4444' },
    { name: 'Active', value: active || 0, color: '#e0e7ff' },
  ]

  const winRate =
    won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-gray-900 font-semibold text-sm mb-4">Deal Outcomes</h2>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx={55}
                cy={55}
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{winRate}%</p>
              <p className="text-xs text-gray-400">win</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {data.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-gray-500">{name}</span>
              </div>
              <span className="text-xs font-medium text-gray-900">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-xs font-medium text-gray-900">
              {won + lost + active}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}