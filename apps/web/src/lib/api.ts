import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshRequest: Promise<string> | null = null

async function refreshAccessToken() {
  const { refreshToken, setAccessToken, logout } = useAuthStore.getState()

  if (!refreshToken) {
    logout()
    throw new Error('Missing refresh token')
  }

  if (!refreshRequest) {
    refreshRequest = axios
      .post<{ accessToken: string }>('/api/v1/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        return data.accessToken
      })
      .catch((error) => {
        logout()
        throw error
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

// Injeta Bearer token em todas as requisições
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh automático ao receber 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined
    const isUnauthorized = error.response?.status === 401
    const isNonRefreshableAuthRoute =
      typeof original?.url === 'string' &&
      ['/auth/login', '/auth/logout', '/auth/refresh'].includes(original.url)

    if (!original || !isUnauthorized || original._retry || isNonRefreshableAuthRoute) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      const accessToken = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch {
      return Promise.reject(error)
    }
  },
)
