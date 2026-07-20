/**
 * Zustand store for deals and churn predictions.
 * Any component can call useDealsStore() to access deals state.
 */
import { create } from 'zustand'
import { getDeals, getChurnPredictions, refreshChurnScores } from '../api/deals'

const useDealsStore = create((set) => ({
  // State
  deals: [],
  atRiskDeals: [],
  loading: false,
  error: null,

  // Actions
  fetchDeals: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getDeals()
      set({ deals: res.data.data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchAtRiskDeals: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getChurnPredictions()
      const atRisk = res.data.data.filter((d) => d.churn_score >= 0.7)
      set({ atRiskDeals: atRisk, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  refreshChurn: async () => {
    set({ loading: true, error: null })
    try {
      await refreshChurnScores()
      const res = await getDeals()
      set({ deals: res.data.data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

export default useDealsStore