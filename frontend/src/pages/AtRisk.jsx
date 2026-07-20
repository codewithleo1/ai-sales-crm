/**
 * At-Risk page — full list of high churn deals with AI actions.
 */
import { useEffect, useState } from 'react'
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import EmailDraftModal from '../components/ai/EmailDraftModal'
import useDealsStore from '../store/dealsStore'

export default function AtRisk() {
  const { atRiskDeals, loading, fetchAtRiskDeals, refreshChurn } = useDealsStore()
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAtRiskDeals()
  }, [])

  const handleRefreshChurn = async () => {
    setRefreshing(true)
    await refreshChurn()
    await fetchAtRiskDeals()
    setRefreshing(false)
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="At-Risk Accounts"
        onRefresh={handleRefreshChurn}
        loading={loading || refreshing}
      />

      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <p className="text-slate-400 text-sm">
            {atRiskDeals.length} deals with churn score ≥ 70%
          </p>
        </div>

        {atRiskDeals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <p className="text-slate-500 text-sm">No at-risk deals. Pipeline looks healthy!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {atRiskDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-sm">{deal.title}</h3>
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                      {Math.round(deal.churn_score * 100)}% risk
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Stage: {deal.stage} · Value: ${Number(deal.value || 0).toLocaleString()} · {deal.days_in_stage || 0} days in stage
                  </p>
                  {deal.notes && (
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      {deal.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDeal(deal)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors shrink-0"
                >
                  <Mail size={12} />
                  Draft Follow-up
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDeal && (
        <EmailDraftModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  )
}