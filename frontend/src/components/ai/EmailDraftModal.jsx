/**
 * Email Draft Modal — AI drafts + optionally sends real email via Resend.
 */
import { useState, useEffect } from 'react'
import { X, Mail, Loader2, Send } from 'lucide-react'
import useInsightsStore from '../../store/insightsStore'
import client from '../../api/client'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'friendly', label: 'Friendly' },
]

export default function EmailDraftModal({ deal, onClose }) {
  const [tone, setTone] = useState('professional')
  const [toEmail, setToEmail] = useState('')
  const [toName, setToName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(null)
  const { emailDraft, emailLoading, draftEmail, clearEmailDraft } = useInsightsStore()

  useEffect(() => {
    if (deal) draftEmail(deal.id, tone)
    return () => clearEmailDraft()
  }, [deal])

  const handleToneChange = (newTone) => {
    setTone(newTone)
    draftEmail(deal.id, newTone)
  }

  const handleSend = async () => {
    if (!toEmail) {
      setSendError('Please enter a recipient email address')
      return
    }
    setSending(true)
    setSendError(null)
    setSent(false)
    try {
      await client.post('/api/emails/send', {
        deal_id: deal.id,
        tone,
        to_email: toEmail,
        to_name: toName || 'Valued Customer',
      })
      setSent(true)
    } catch (err) {
      setSendError(err.response?.data?.detail || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (!deal) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Mail size={14} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">Draft Follow-up Email</h2>
              <p className="text-gray-400 text-xs">{deal.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Tone Selector */}
        <div className="flex gap-2 p-5 border-b border-gray-100">
          <span className="text-gray-500 text-xs self-center mr-1">Tone:</span>
          {TONES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleToneChange(value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tone === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {emailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-indigo-500 mr-2" />
              <span className="text-gray-400 text-sm">Drafting email...</span>
            </div>
          ) : emailDraft ? (
            <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {emailDraft.email}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm">No draft yet.</p>
          )}
        </div>

        {/* Send Section */}
        <div className="p-5 border-t border-gray-100">
          {/* Success message */}
          {sent && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-emerald-700 text-xs font-medium">
                Email sent successfully to {toEmail}!
              </p>
            </div>
          )}

          {/* Error message */}
          {sendError && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
              <p className="text-red-600 text-xs">{sendError}</p>
            </div>
          )}

          {/* Recipient fields */}
          <div className="flex gap-3 mb-3">
            <input
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="Recipient name"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="Recipient email *"
              type="email"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-xs">Generated by Groq · llama-3.1-8b-instant</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (emailDraft?.email) navigator.clipboard.writeText(emailDraft.email)
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium"
              >
                Copy
              </button>
              <button
                onClick={handleSend}
                disabled={sending || emailLoading || !emailDraft}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}