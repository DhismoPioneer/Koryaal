import axios from 'axios'

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const fallbackBaseUrl = isLocalhost
  ? 'http://127.0.0.1:8000/api'
  : 'https://koryaal-backend.onrender.com/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export default api
