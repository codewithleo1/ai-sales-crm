/**
 * Pipeline page — Kanban board with deals grouped by stage.
 */
import { useEffect, useState } from 'react'
import { Plus, Mail, Search } from 'lucide-react'
import EmailDraftModal from '../components/ai/EmailDraftModal'
import AddDealModal from '../components/deals/AddDealModal'
import useDealsStore from '../store/dealsStore'
import { updateDeal } from '../api/deals'

const STAGES = [
  { key: 'prospecting', label: 'Prospecting', color: '#818cf8' },
  { key: 'qualification', label: 'Qualification', color: '#6366f1' },
  { key: 'proposal', label: 'Proposal', color: '#4f46e5' },
  { key: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { key: 'closed_won', label: 'Closed Won', color: '#10b981' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#ef4444' },
]

const CHURN_COLOR = (score) => {
  if (score >= 0.7) return 'text-red-500'
  if (score >= 0.4) return 'text-amber-500'
  return 'text-emerald-500'
}

export default function Pipeline() {
  const { deals, loading, fetchDeals } = useDealsStore()
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchDeals() }, [])

  const dealsByStage = (stage) =>
    deals.filter(
      (d) =>
        d.stage === stage &&
        (search === '' ||
          d.title.toLowerCase().includes(search.toLowerCase()))
    )

  const handleDragStart = (deal) => setDragging(deal)

  const handleDrop = async (stage) => {
    if (!dragging || dragging.stage === stage) return
    try {
      await updateDeal(dragging.id, { stage })
      await fetchDeals()
    } catch (e) {
      console.error('Failed to update deal stage', e)
    }
    setDragging(null)
  }

  const stageValue = (stage) =>
    dealsByStage(stage).reduce((s, d) => s + Number(d.value || 0), 0)

  return (
    <div className="flex flex-col flex-1 h-screen">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-6 shrink-0">
        <h1 className="text-gray-900 font-semibold text-base shrink-0">Pipeline</h1>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
          />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setShowAddDeal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Deal
          </button>
          <button
            onClick={fetchDeals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {STAGES.map(({ key, label, color }) => (
            <div
              key={key}
              className="flex flex-col w-64 shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(key)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {dealsByStage(key).length}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  ${(stageValue(key) / 1000).toFixed(0)}k
                </span>
              </div>

              {/* Stage color line */}
              <div className="h-0.5 rounded-full mb-3" style={{ background: color }} />

              {/* Deal Cards */}
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-4">
                {loading ? (
                  <div className="bg-white rounded-lg p-3 border border-gray-100 animate-pulse h-20" />
                ) : dealsByStage(key).length === 0 ? (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(key)}
                  >
                    <p className="text-gray-300 text-xs">
                      {search ? 'No matches' : 'Drop deals here'}
                    </p>
                  </div>
                ) : (
                  dealsByStage(key).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal)}
                      className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <p className="text-gray-900 text-xs font-medium leading-snug mb-1">
                        {deal.title}
                      </p>
                      <p className="text-gray-400 text-xs mb-2">
                        ${Number(deal.value || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${CHURN_COLOR(deal.churn_score)}`}>
                          {Math.round((deal.churn_score || 0) * 100)}% risk
                        </span>
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          className="p-1 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                        >
                          <Mail size={10} className="text-indigo-600" />
                        </button>
                      </div>
                      {deal.probability !== null && (
                        <div className="mt-2">
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-400"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <p className="text-gray-300 text-xs mt-0.5">
                            {deal.probability}% probability
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDeal && (
        <EmailDraftModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
      {showAddDeal && (
        <AddDealModal onClose={() => setShowAddDeal(false)} />
      )}
    </div>
  )
}