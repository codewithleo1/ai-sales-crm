/**
 * Dashboard page — KPI cards, charts, at-risk panel, AI insights feed.
 */
import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Users, Plus } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import KPICard from '../components/dashboard/KPICard'
import AtRiskPanel from '../components/dashboard/AtRiskPanel'
import AIInsightsFeed from '../components/dashboard/AIInsightsFeed'
import PipelineChart from '../components/dashboard/PipelineChart'
import WinRateChart from '../components/dashboard/WinRateChart'
import EmailDraftModal from '../components/ai/EmailDraftModal'
import AddDealModal from '../components/deals/AddDealModal'
import useDealsStore from '../store/dealsStore'
import useInsightsStore from '../store/insightsStore'

export default function Dashboard() {
  const { deals, atRiskDeals, loading, fetchDeals, fetchAtRiskDeals } = useDealsStore()
  const { fetchInsights } = useInsightsStore()
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showAddDeal, setShowAddDeal] = useState(false)

  useEffect(() => {
    fetchDeals()
    fetchAtRiskDeals()
    fetchInsights()
  }, [])

  const totalPipeline = deals.reduce((sum, d) => sum + Number(d.value || 0), 0)
  const wonDeals = deals.filter((d) => d.stage === 'closed_won')
  const closedDeals = deals.filter((d) => ['closed_won', 'closed_lost'].includes(d.stage))
  const winRate = closedDeals.length ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0
  const avgDealValue = deals.length ? Math.round(totalPipeline / deals.length) : 0

  const handleRefresh = () => {
    fetchDeals()
    fetchAtRiskDeals()
    fetchInsights()
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">
        <h1 className="text-gray-900 font-semibold text-base">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddDeal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} />
            Add Deal
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Pipeline" value={`$${(totalPipeline / 1000000).toFixed(1)}M`} subtitle={`${deals.length} active deals`} color="indigo" />
          <KPICard title="Win Rate" value={`${winRate}%`} subtitle={`${wonDeals.length} deals won`} color="green" />
          <KPICard title="At-Risk Deals" value={atRiskDeals.length} subtitle="Churn score ≥ 70%" color="red" />
          <KPICard title="Avg Deal Value" value={`$${(avgDealValue / 1000).toFixed(0)}k`} subtitle="Across all stages" color="yellow" />
        </div>
        

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PipelineChart deals={deals} />
          </div>
          <WinRateChart deals={deals} />
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AtRiskPanel onDraftEmail={setSelectedDeal} />
          <AIInsightsFeed />
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