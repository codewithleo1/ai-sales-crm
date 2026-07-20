/**
 * Pipeline page — full deal table with churn scores.
 */
import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import EmailDraftModal from '../components/ai/EmailDraftModal'
import useDealsStore from '../store/dealsStore'

const STAGE_COLORS = {
  prospecting: 'bg-slate-700 text-slate-300',
  qualification: 'bg-blue-500/20 text-blue-400',
  proposal: 'bg-indigo-500/20 text-indigo-400',
  negotiation: 'bg-amber-500/20 text-amber-400',
  closed_won: 'bg-emerald-500/20 text-emerald-400',
  closed_lost: 'bg-red-500/20 text-red-400',
}

const CHURN_COLOR = (score) => {
  if (score >= 0.7) return 'text-red-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function Pipeline() {
  const { deals, loading, fetchDeals } = useDealsStore()
  const [selectedDeal, setSelectedDeal] = useState(null)

  useEffect(() => {
    fetchDeals()
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Pipeline" onRefresh={fetchDeals} loading={loading} />

      <div className="p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Deal', 'Stage', 'Value', 'Probability', 'Churn Risk', 'Days in Stage', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 text-sm py-10">
                    Loading deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 text-sm py-10">
                    No deals yet. Create one via the API.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{deal.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate max-w-48">
                        {deal.notes || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[deal.stage] || 'bg-slate-700 text-slate-300'}`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      ${Number(deal.value || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {deal.probability || 0}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${CHURN_COLOR(deal.churn_score)}`}>
                        {Math.round((deal.churn_score || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {deal.days_in_stage || 0}d
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedDeal(deal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
                      >
                        <Mail size={11} />
                        Draft
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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