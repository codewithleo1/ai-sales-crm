import { Sparkles } from 'lucide-react'
import useInsightsStore from '../../store/insightsStore'

export default function AIInsightsFeed() {
  const { insights, loading, generateInsights } = useInsightsStore()

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} style={{ color: '#7c3aed' }} />
        <h2 className="text-gray-900 font-semibold text-sm">AI Insights</h2>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="ml-auto text-xs font-medium disabled:opacity-50 transition-colors"
          style={{ color: '#7c3aed' }}
        >
          {loading ? 'Generating...' : 'Generate New'}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-3">No insights yet.</p>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="px-4 py-2 text-white text-xs rounded-lg transition-colors disabled:opacity-50 font-medium"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            {loading ? 'Analyzing pipeline...' : 'Analyze Pipeline'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-3 rounded-lg"
              style={{ background: '#eef2ff', borderLeft: '3px solid #7c3aed' }}
            >
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#3730a3' }}>
                {insight.content}
              </p>
              <p className="text-xs mt-2" style={{ color: '#a5b4fc' }}>
                {new Date(insight.generated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}