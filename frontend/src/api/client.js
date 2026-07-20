/**
 * Axios instance pre-configured with the backend base URL.
 * All API calls in the app import from this file.
 */
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default client