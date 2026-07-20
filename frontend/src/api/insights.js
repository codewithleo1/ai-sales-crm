/** AI insights and email draft API calls. */
import client from './client'

export const getInsights = () => client.get('/api/insights')
export const generateInsights = () => client.post('/api/insights/generate')
export const draftEmail = (dealId, tone) =>
  client.post('/api/emails/draft', { deal_id: dealId, tone })