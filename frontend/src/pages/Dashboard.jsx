import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import KPICard from '../components/dashboard/KPICard'
import AtRiskPanel from '../components/dashboard/AtRiskPanel'
import AIInsightsFeed from '../components/dashboard/AIInsightsFeed'
import EmailDraftModal from '../components/ai/EmailDraftModal'
import useDealsStore from '../store/dealsStore'
import useInsightsStore from '../store/insightsStore'

export default function Dashboard() {
  const { deals, atRiskDeals, loading, fetchDeals, fetchAtRiskDeals } = useDealsStore()
  const { fetchInsights } = useInsightsStore()
  const [selectedDeal, setSelectedDeal] = useState(null)

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

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Dashboard" onRefresh={() => { fetchDeals(); fetchAtRiskDeals(); fetchInsights() }} loading={loading} />

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Pipeline" value={`$${(totalPipeline / 1000).toFixed(0)}k`} subtitle={`${deals.length} active deals`} color="indigo" />
          <KPICard title="Win Rate" value={`${winRate}%`} subtitle={`${wonDeals.length} deals won`} color="green" />
          <KPICard title="At-Risk Deals" value={atRiskDeals.length} subtitle="Churn score ≥ 70%" color="red" />
          <KPICard title="Avg Deal Value" value={`$${(avgDealValue / 1000).toFixed(0)}k`} subtitle="Across all stages" color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AtRiskPanel onDraftEmail={setSelectedDeal} />
          <AIInsightsFeed />
        </div>
      </div>

      {selectedDeal && (
        <EmailDraftModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  )
}