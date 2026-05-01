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

  searchQuery: string
  setSearchQuery: (query: string) => void
  notifications: any[]
  addNotification: (notification: any) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void
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

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  notifications: [
    { id: '1', title: 'New Incident', message: 'Major flooding reported in Colombo 7', time: '2 mins ago', type: 'incident', unread: true },
    { id: '2', title: 'Alert Broadcast', message: 'Red alert issued for Western Province', time: '15 mins ago', type: 'alert', unread: true },
    { id: '3', title: 'Task Assigned', message: 'New rescue task assigned to you', time: '1 hour ago', type: 'task', unread: false },
  ],
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, unread: false } : n)
  })),
  clearNotifications: () => set({ notifications: [] }),
}))
