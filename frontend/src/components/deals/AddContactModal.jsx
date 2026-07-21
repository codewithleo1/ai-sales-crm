/**
 * Add Contact modal — create a new contact from the UI.
 */
import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import client from '../../api/client'

export default function AddContactModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    phone: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await client.post('/api/contacts', form)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError('Failed to create contact. Email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <UserPlus size={14} className="text-indigo-600" />
            </div>
            <h2 className="text-gray-900 font-semibold text-sm">Add New Contact</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="John Smith"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="john@company.com"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Company</label>
              <input name="company" value={form.company} onChange={handleChange}
                placeholder="Acme Corp"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Title</label>
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="VP of Sales"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="+91 98765 43210"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-gray-600 text-xs font-medium hover:bg-gray-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}