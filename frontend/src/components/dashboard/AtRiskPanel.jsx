import { AlertTriangle, Mail } from 'lucide-react'
import useDealsStore from '../../store/dealsStore'

export default function AtRiskPanel({ onDraftEmail }) {
  const { atRiskDeals, loading } = useDealsStore()

  const getRiskStyle = (score) => {
    if (score >= 0.8) return { bg: '#fee2e2', color: '#991b1b' }
    if (score >= 0.7) return { bg: '#fef3c7', color: '#92400e' }
    return { bg: '#fef9c3', color: '#854d0e' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <p className="text-gray-400 text-sm">Loading at-risk deals...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={15} className="text-amber-500" />
        <h2 className="text-gray-900 font-semibold text-sm">At-Risk Accounts</h2>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {atRiskDeals.length} deals
        </span>
      </div>

      {atRiskDeals.length === 0 ? (
        <p className="text-gray-400 text-sm">No at-risk deals. Great work!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {atRiskDeals.map((deal) => {
            const rs = getRiskStyle(deal.churn_score)
            return (
              <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{deal.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {deal.stage} · ${Number(deal.value || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={rs}>
                    {Math.round(deal.churn_score * 100)}%
                  </span>
                  <button
                    onClick={() => onDraftEmail(deal)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: '#4f46e5' }}
                    title="Draft follow-up email"
                  >
                    <Mail size={12} className="text-white" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}