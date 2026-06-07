import axios from 'axios'

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const isVercelApp = window.location.hostname === 'koryaal.vercel.app'

const fallbackBaseUrl = isLocalhost
  ? 'http://127.0.0.1:8000/api'
  : '/api'

const api = axios.create({
  baseURL: isVercelApp ? '/api' : import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export default api
