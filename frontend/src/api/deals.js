/** Deal-related API calls. */
import client from './client'

export const getDeals = () => client.get('/api/deals')
export const getDeal = (id) => client.get(`/api/deals/${id}`)
export const createDeal = (data) => client.post('/api/deals', data)
export const updateDeal = (id, data) => client.patch(`/api/deals/${id}`, data)
export const deleteDeal = (id) => client.delete(`/api/deals/${id}`)
export const getChurnPredictions = () => client.get('/api/predictions/churn')
export const refreshChurnScores = () => client.post('/api/predictions/refresh')