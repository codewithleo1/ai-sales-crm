/**
 * Contacts page — list all contacts, add new ones.
 */
import { useEffect, useState } from 'react'
import { UserPlus, Mail, Phone, Building2 } from 'lucide-react'
import AddContactModal from '../components/deals/AddContactModal'
import client from '../api/client'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await client.get('/api/contacts')
      setContacts(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContacts() }, [])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">
        <h1 className="text-gray-900 font-semibold text-base">Contacts</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <UserPlus size={13} />
          Add Contact
        </button>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, or email..."
          className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Stats */}
        <p className="text-gray-400 text-xs">{filtered.length} contacts</p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((contact) => (
              <div key={contact.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 text-sm font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-gray-400 text-xs truncate">{contact.title || 'No title'}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1.5">
                  {contact.company && (
                    <div className="flex items-center gap-2">
                      <Building2 size={11} className="text-gray-300 shrink-0" />
                      <span className="text-gray-500 text-xs truncate">{contact.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail size={11} className="text-gray-300 shrink-0" />
                    <span className="text-gray-500 text-xs truncate">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="text-gray-300 shrink-0" />
                      <span className="text-gray-500 text-xs truncate">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddContactModal onClose={() => setShowAdd(false)} onSuccess={fetchContacts} />
      )}
    </div>
  )
}