import { create } from 'zustand'

interface User {
  id: string
  name: string
  role: 'CITIZEN' | 'VOLUNTEER' | 'ADMIN' | 'DMC_OFFICER'
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
  setNotifications: (notifications: any[]) => void
  addNotification: (notification: any) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void
}

let initialUser = null;
try {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    initialUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.error("Failed to parse user from local storage", e);
}

export const useAppStore = create<AppState>((set) => ({
  user: initialUser,
  setUser: (user) => set({ user }),
  isAuthenticated: !!initialUser,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),
  
  activeIncidentId: null,
  setActiveIncidentId: (activeIncidentId) => set({ activeIncidentId }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, unread: false, read: true } : n)
  })),
  clearNotifications: () => set({ notifications: [] }),
}))
