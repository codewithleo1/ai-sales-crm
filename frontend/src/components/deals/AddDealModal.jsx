/**
 * Add Deal modal — create a new deal from the UI.
 */
import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { createDeal } from '../../api/deals'
import useDealsStore from '../../store/dealsStore'

const STAGES = [
  'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
]

export default function AddDealModal({ onClose }) {
  const { fetchDeals, fetchAtRiskDeals } = useDealsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    title: '',
    stage: 'prospecting',
    value: '',
    probability: '',
    expected_close_date: '',
    notes: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.title) {
      setError('Deal title is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createDeal({
        ...form,
        value: form.value ? Number(form.value) : null,
        probability: form.probability ? Number(form.probability) : null,
        expected_close_date: form.expected_close_date || null,
      })
      await fetchDeals()
      await fetchAtRiskDeals()
      onClose()
    } catch (err) {
      setError('Failed to create deal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Plus size={14} className="text-indigo-600" />
            </div>
            <h2 className="text-gray-900 font-semibold text-sm">Add New Deal</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Deal Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Acme Corp — Enterprise License"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Stage</label>
              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Value ($)</label>
              <input
                name="value"
                type="number"
                value={form.value}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Win Probability (%)</label>
              <input
                name="probability"
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={handleChange}
                placeholder="e.g. 65"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Expected Close Date</label>
              <input
                name="expected_close_date"
                type="date"
                value={form.expected_close_date}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any context about this deal..."
              rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 text-xs font-medium hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}