import { createContext, useContext } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface AuthContextType {
  user: any
  login: (role: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser, setAuthenticated } = useAppStore()

  const login = (role: string) => {
    // In a real app, this would involve a backend call and JWT storage
    const mockUser = {
      id: '1',
      name: 'Test Officer',
      role: role as any,
    }
    setUser(mockUser)
    setAuthenticated(true)
  }

  const logout = () => {
    setUser(null)
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
