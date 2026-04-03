import { create } from 'zustand'

interface User {
  id: string
  name: string
  role: 'DMC_ADMIN' | 'DMC_OFFICER' | 'VOLUNTEER'
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  setAuthenticated: (auth: boolean) => void
  
  incidents: any[]
  setIncidents: (incidents: any[]) => void
  
  activeIncidentId: string | null
  setActiveIncidentId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),
  
  activeIncidentId: null,
  setActiveIncidentId: (activeIncidentId) => set({ activeIncidentId }),
}))
