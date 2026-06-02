import { Bell, Search, X, Check, Info, AlertTriangle, Zap, MessageSquare, User, Settings, LogOut, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

export function Header() {
  const { t } = useTranslation()
  const { searchQuery, setSearchQuery, notifications, setNotifications, clearNotifications, markAsRead } = useAppStore()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  
  const unreadCount = notifications.filter(n => n.unread || (n.read === false)).length

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const res = await axios.get('http://localhost:3001/api/notifications/my', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        const formatted = res.data.map((n: any) => ({
          ...n,
          unread: !n.read,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: n.title.toLowerCase().includes('alert') ? 'alert' : 
                n.title.toLowerCase().includes('task') ? 'task' : 'incident'
        }))
        setNotifications(formatted)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      }
    }
    fetchNotifications()
  }, [setNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">

        <div className="hidden md:flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-xl w-96 border border-transparent focus-within:border-primary/20 focus-within:bg-card transition-all group relative">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t('header.search_placeholder')}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  System Functions & Pages
                </div>
                {(() => {
                  const searchItems = [
                    { title: 'Dashboard', path: '/', icon: '📊', keywords: 'home main overview' },
                    { title: 'Incidents Management', path: '/incidents', icon: '🚨', keywords: 'emergencies disasters reports' },
                    { title: 'Live Map', path: '/map', icon: '🗺️', keywords: 'gis location tracking' },
                    { title: 'Emergency Alerts', path: '/alerts', icon: '⚠️', keywords: 'broadcasts warnings notifications' },
                    { title: 'Relief Camps', path: '/camps', icon: '🏕️', keywords: 'shelters safety hubs' },
                    { title: 'Resources', path: '/resources', icon: '📦', keywords: 'inventory supplies' },
                    { title: 'Volunteers', path: '/volunteers', icon: '🤝', keywords: 'people community force' },
                    { title: 'Help Requests', path: '/help-requests', icon: '🆘', keywords: 'assistance support' },
                    { title: 'Missing Persons', path: '/missing-persons', icon: '👤', keywords: 'lost found people' },
                    { title: 'Damage Assessment', path: '/damage-assessment', icon: '🏗️', keywords: 'buildings infrastructure' },
                    { title: 'Tokens', path: '/tokens', icon: '🎫', keywords: 'relief access' },
                    { title: 'Settings', path: '/settings', icon: '⚙️', keywords: 'preferences config account profile' }
                  ];
                  
                  const query = searchQuery.toLowerCase();
                  const results = searchItems.filter(item => 
                    item.title.toLowerCase().includes(query) || 
                    item.keywords.includes(query)
                  );

                  if (results.length === 0) {
                    return (
                      <div className="px-3 py-4 text-center text-sm font-bold text-muted-foreground">
                        No matches found for "{searchQuery}"
                      </div>
                    );
                  }

                  return results.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-xl transition-colors text-left"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="text-sm font-black text-foreground">{item.title}</div>
                        <div className="text-[10px] font-bold text-muted-foreground">{item.path}</div>
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 relative" ref={notifDropdownRef}>
        <button 
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={cn(
            "relative p-2.5 rounded-xl hover:bg-muted transition-all border border-transparent active:scale-95",
            isNotifOpen && "bg-muted shadow-inner"
          )}
        >
          <Bell className={cn("w-5 h-5 transition-colors", isNotifOpen ? "text-primary" : "text-muted-foreground")} />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse"></span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isNotifOpen && (
          <div className="absolute top-14 right-0 w-96 bg-card border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="text-lg font-black text-foreground">{t('header.alerts_title')}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Live Sync active</p>
              </div>
              <button 
                onClick={clearNotifications}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                {t('header.clear_all')}
              </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground/50">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">All systems clear</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      className={cn(
                        "p-5 hover:bg-muted/50 transition-colors cursor-pointer group relative",
                        notif.unread && "bg-primary/[0.02]"
                      )}
                    >
                      {notif.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                          notif.type === 'incident' ? "bg-red-50 text-red-500" :
                          notif.type === 'alert' ? "bg-amber-50 text-amber-500" :
                          "bg-blue-50 text-blue-500"
                        )}>
                          {notif.type === 'incident' ? <AlertTriangle className="w-5 h-5" /> :
                           notif.type === 'alert' ? <Zap className="w-5 h-5" /> :
                           <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-foreground uppercase tracking-tight truncate">{notif.title}</span>
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-[13px] font-bold text-muted-foreground leading-snug mt-1 group-hover:text-foreground transition-colors line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-muted/20 text-center border-t">
              <button className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:text-primary transition-colors">
                View All Archives
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pl-6 border-l border-border/60 relative" ref={userDropdownRef}>
          <div 
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{user?.name || 'DMC Officer'}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{user?.region || user?.role?.replace('_', ' ') || 'Region 3 - Colombo'}</p>
            </div>
            <div className="relative">
              {(user as any)?.profilePicture ? (
                <img 
                  src={(user as any).profilePicture} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-transparent group-hover:border-primary/20 transition-all" 
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 border-2 border-transparent group-hover:border-primary/20 transition-all">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'DO'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-card rounded-full flex items-center justify-center shadow-sm border border-border">
                <ChevronDown className={cn("w-2.5 h-2.5 text-muted-foreground transition-transform", isUserOpen && "rotate-180")} />
              </div>
            </div>
          </div>

          {/* User Dropdown Menu */}
          {isUserOpen && (
            <div className="absolute top-14 right-0 w-64 bg-card border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary overflow-hidden">
                     {(user as any)?.profilePicture ? (
                       <img src={(user as any).profilePicture} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <Shield className="w-6 h-6" />
                     )}
                   </div>
                   <div>
                     <p className="text-sm font-black text-foreground truncate">{user?.name || 'Officer Account'}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.region || user?.email || 'officer@dmc.gov'}</p>
                   </div>
                </div>
              </div>

              <div className="p-2">
                <button 
                  onClick={() => { setIsUserOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all group"
                >
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                    <User className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground group-hover:text-foreground">{t('header.node_profile')}</span>
                </button>
                <button 
                   onClick={() => { setIsUserOpen(false); navigate('/settings'); }}
                   className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all group"
                >
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground group-hover:text-foreground">{t('header.system_config')}</span>
                </button>
                
                <div className="my-2 border-t border-border/50" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/5 transition-all group"
                >
                  <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                  </div>
                  <span className="text-xs font-black text-red-400 group-hover:text-red-600">{t('header.terminate_session')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
