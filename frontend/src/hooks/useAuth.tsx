import { createContext, useContext, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { authService, userService } from '../services/api'

interface AuthContextType {
  user: any
  login: (credentials: any) => Promise<any>
  googleLogin: (idToken: string) => Promise<void>
  logout: () => void
  updateUser: (userData: any) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/** Returns the number of milliseconds until the JWT expires, or 0 if already expired / invalid. */
function msUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return 0
    return Math.max(0, payload.exp * 1000 - Date.now())
  } catch {
    return 0
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser, setAuthenticated } = useAppStore()
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }

  const forceLogout = () => {
    clearExpiryTimer()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setAuthenticated(false)
    // Hard redirect so the router always lands on /login
    window.location.href = '/login'
  }

  /** Schedule an automatic logout when the token expires. */
  const scheduleExpiry = (token: string) => {
    clearExpiryTimer()
    const ms = msUntilExpiry(token)
    if (ms <= 0) {
      forceLogout()
      return
    }
    expiryTimerRef.current = setTimeout(forceLogout, ms)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    // No token or already expired → clear everything and stay on /login
    if (!token || !savedUser || msUntilExpiry(token) <= 0) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return
    }

    // Token is still valid — restore session
    setUser(JSON.parse(savedUser))
    setAuthenticated(true)
    scheduleExpiry(token)

    // Refresh user data from server in the background
    userService.getMe()
      .then(res => {
        const fresh = res.data
        localStorage.setItem('user', JSON.stringify(fresh))
        setUser(fresh)
      })
      .catch(() => {
        // Server rejected the token (revoked, secret changed, etc.) → force logout
        forceLogout()
      })

    return () => clearExpiryTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (credentials: any) => {
    const res = await authService.login(credentials)

    if (res.data.requires2FA) {
      return res.data
    }

    const { token, user: userData } = res.data
    if (!token || !userData) throw new Error('Invalid login response from server')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setAuthenticated(true)
    scheduleExpiry(token)
  }

  const googleLogin = async (idToken: string) => {
    const res = await authService.googleLogin(idToken)
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setAuthenticated(true)
    scheduleExpiry(token)
  }

  const logout = () => {
    clearExpiryTimer()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setAuthenticated(false)
  }

  const updateUser = (userData: any) => {
    const updatedUser = { ...user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
