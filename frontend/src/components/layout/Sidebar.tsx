import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Map as MapIcon, AlertTriangle, Users, BarChart3, Bell, Settings, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Impact Map', href: '/map', icon: MapIcon, status: 'LIVE' },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle, count: 12 },
  { name: 'Alerts', href: '/alerts', icon: Bell, count: 3 },
  { name: 'Analytics', href: '/reports', icon: BarChart3 },
  { name: 'User Management', href: '/users', icon: Users },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex flex-col w-72 bg-card border-r h-full shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3 p-8 border-b border-border/40 mb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <Shield className="text-primary w-7 h-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-none tracking-tighter text-foreground uppercase">SURAKSHA</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-1 opacity-70">DMC Command Center</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:pl-5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                {item.name}
              </div>
              
              {item.status && (
                <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {item.status}
                </span>
              )}
              
              {item.count && !item.status && (
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all hover:bg-muted mb-2",
            location.pathname === '/settings' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        
        <button className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground w-full rounded-xl hover:bg-destructive/5 hover:text-destructive transition-all">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
