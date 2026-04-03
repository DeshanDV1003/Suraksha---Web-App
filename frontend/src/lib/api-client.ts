import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add interceptors for JWT if needed
apiClient.interceptors.request.use((config) => {
  // Tokens are stored in HTTP-only cookies as per requirements, 
  // but if we needed to add a header, we do it here.
  return config
})

export default apiClient
