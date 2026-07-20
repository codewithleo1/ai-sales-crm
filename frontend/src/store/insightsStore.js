/**
 * Zustand store for AI insights and email drafts.
 */
import { create } from 'zustand'
import { getInsights, generateInsights, draftEmail } from '../api/insights'

const useInsightsStore = create((set) => ({
  // State
  insights: [],
  emailDraft: null,
  loading: false,
  emailLoading: false,
  error: null,

  // Actions
  fetchInsights: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getInsights()
      set({ insights: res.data.data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  generateInsights: async () => {
    set({ loading: true, error: null })
    try {
      await generateInsights()
      const res = await getInsights()
      set({ insights: res.data.data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  draftEmail: async (dealId, tone) => {
    set({ emailLoading: true, emailDraft: null, error: null })
    try {
      const res = await draftEmail(dealId, tone)
      set({ emailDraft: res.data.data, emailLoading: false })
    } catch (err) {
      set({ error: err.message, emailLoading: false })
    }
  },

  clearEmailDraft: () => set({ emailDraft: null }),
}))

export default useInsightsStore