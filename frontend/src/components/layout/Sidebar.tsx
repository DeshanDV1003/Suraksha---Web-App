import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MapPin, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  Radio, 
  Package, 
  Building2, 
  QrCode, 
  Settings, 
  LogOut, 
  Shield,
  HeartPulse,
  Home,
  UserSearch,
  HandHelping,
  ExternalLink,
  CreditCard,
  ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { incidentService, alertService } from '../../services/api'
import logo from '@/pictures/Full logo.png'

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { logout, user } = useAuth()
  const [counts, setCounts] = useState({ incidents: 0, alerts: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [incRes, alertRes] = await Promise.all([
          incidentService.getIncidents(),
          alertService.getAlerts()
        ])
        setCounts({
          incidents: incRes.data.filter((i: any) => i.status !== 'RESOLVED').length,
          alerts: alertRes.data.length
        })
      } catch (err) {
        console.error('Failed to fetch counts', err)
      }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000) // Polling for counts
    return () => clearInterval(interval)
  }, [])

  const role = user?.role || 'CITIZEN'

  const mainNavigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.map'), href: '/map', icon: MapPin, status: 'LIVE', roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.incidents'), href: '/incidents', icon: AlertTriangle, count: counts.incidents, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.alerts'), href: '/alerts', icon: Radio, count: counts.alerts, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.analytics'), href: '/reports', icon: BarChart3, roles: ['ADMIN', 'DMC_OFFICER'] },
    { name: t('nav.user_management'), href: '/users', icon: Users, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(role))
  
  const resourceNavigation = [
    { name: t('nav.resources'), href: '/resources', icon: Package, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER'] },
    { name: t('nav.camps'), href: '/camps', icon: Building2, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.tokens'), href: '/tokens', icon: QrCode, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER'] },
    { name: 'Donations', href: '/donations', icon: CreditCard, roles: ['ADMIN', 'DMC_OFFICER'] },
  ].filter(item => item.roles.includes(role))

  const safetyNavigation = [
    { name: t('nav.volunteers'), href: '/volunteers', icon: Shield, roles: ['ADMIN', 'DMC_OFFICER'] },
    { name: t('nav.help_requests'), href: '/help-requests', icon: HandHelping, roles: ['ADMIN', 'DMC_OFFICER', 'CITIZEN'] },
    { name: t('nav.damage_assessment'), href: '/damage-assessment', icon: Home, roles: ['ADMIN', 'DMC_OFFICER', 'CITIZEN'] },
    { name: t('nav.missing_persons'), href: '/missing-persons', icon: UserSearch, roles: ['ADMIN', 'DMC_OFFICER', 'CITIZEN'] },
    { name: 'Safety Roster', href: '/family-safety', icon: ShieldCheck, roles: ['ADMIN', 'DMC_OFFICER', 'CITIZEN', 'VOLUNTEER'] },
    { name: t('nav.support'), href: '/support', icon: HeartPulse, roles: ['ADMIN', 'DMC_OFFICER', 'CITIZEN'] },
    { name: t('nav.public_help_portal'), href: '/request-help', icon: ExternalLink, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
    { name: t('nav.public_missing_portal'), href: '/missing-portal', icon: ExternalLink, roles: ['ADMIN', 'DMC_OFFICER', 'VOLUNTEER', 'CITIZEN'] },
  ].filter(item => item.roles.includes(role))

  return (
    <div className="flex flex-col w-72 bg-card border-r h-full shadow-[1px_0_0_0_rgba(0,0,0,0.02)] transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-8 pb-10">
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none tracking-tight text-brand-500 uppercase">SURAKSHA</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 opacity-70">{t('nav.command_center')}</p>
        </div>
      </div>
      
      {/* All Navigation is scrollable together */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {mainNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center justify-between px-5 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group",
                isActive 
                  ? "bg-gradient-to-r from-[#0061ff] to-[#00c6ff] text-white shadow-lg shadow-blue-500/25" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-foreground opacity-70 group-hover:opacity-100 transition-all")} />
                <span className="tracking-tight">{item.name}</span>
              </div>
              
              {item.status && (
                <span className="text-[10px] font-bold bg-[#00d26a] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-green-500/20">
                  {item.status}
                </span>
              )}
              
              {item.count !== undefined && item.count > 0 && !item.status && (
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 min-w-[1.5rem] text-center rounded-full transition-colors",
                  isActive ? "bg-white dark:bg-gray-900/20 text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}

        <div className="pt-10 mb-2">
          <h2 className="px-5 mb-4 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">{t('nav.resources')}</h2>
          
          <div className="space-y-1">
            {resourceNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group",
                    isActive 
                      ? "bg-gradient-to-r from-[#0061ff] to-[#00c6ff] text-white shadow-lg shadow-blue-500/25" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-foreground opacity-70 group-hover:opacity-100 transition-all")} />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="pt-2 mb-2">
          <h2 className="px-5 mb-4 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">{t('nav.safety_support')}</h2>
          
          <div className="space-y-1">
            {safetyNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group",
                    isActive 
                      ? "bg-gradient-to-r from-[#0061ff] to-[#00c6ff] text-white shadow-lg shadow-blue-500/25" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-foreground opacity-70 group-hover:opacity-100 transition-all")} />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Settings and Logout moved inside scrollable nav */}
        <div className="pt-10 pb-10 space-y-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 group",
              location.pathname === '/settings' 
                ? "bg-muted text-primary" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            )}
          >
            <Settings className={cn("w-5 h-5", location.pathname === '/settings' ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")} />
            {t('nav.settings')}
          </Link>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold text-destructive w-full rounded-2xl bg-destructive/10 hover:bg-destructive/20 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </nav>

      {/* Profile Bar at very bottom */}
      <div className="p-6 border-t flex items-center gap-3 bg-card transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0061ff] to-[#00c6ff] flex items-center justify-center text-white text-xs font-black shadow-lg">
             {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-sm font-black text-foreground truncate capitalize">{user?.name || 'Admin'}</div>
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'DMC Officer'}</div>
          </div>
      </div>
    </div>
  )
}
