import { createContext, useContext, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '../services/api'

interface AuthContextType {
  user: any
  login: (credentials: any) => Promise<any>
  logout: () => void
  updateUser: (userData: any) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser, setAuthenticated } = useAppStore()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
      setAuthenticated(true)
    }
  }, [setUser, setAuthenticated])

  const login = async (credentials: any) => {
    try {
      const res = await authService.login(credentials)
      
      if (res.data.requires2FA) {
        return res.data;
      }

      const { token, user: userData } = res.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      setAuthenticated(true)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
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
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
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
