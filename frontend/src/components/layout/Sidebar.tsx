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
  Shield 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import logo from '@/pictures/Full logo.png'

export function Sidebar() {
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

  const mainNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Impact Map', href: '/map', icon: MapPin, status: 'LIVE' },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle, count: counts.incidents },
    { name: 'Alerts', href: '/alerts', icon: Radio, count: counts.alerts },
    { name: 'Analytics', href: '/reports', icon: BarChart3 },
    { name: 'User Management', href: '/users', icon: Users },
  ]
  
  const resourceNavigation = [
    { name: 'Resources', href: '/resources', icon: Package },
    { name: 'Relief Camps', href: '/camps', icon: Building2 },
    { name: 'Token System', href: '/tokens', icon: QrCode },
  ]

  return (
    <div className="flex flex-col w-72 bg-white border-r h-full shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-8 pb-10">
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none tracking-tight text-[#0061ff] uppercase">SURAKSHA</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 opacity-70">Command Center</p>
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
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0061ff]"
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-[#0061ff] opacity-70 group-hover:opacity-100 transition-all")} />
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
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                )}>
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}

        <div className="pt-10 mb-2">
          <h2 className="px-5 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-60">Resources</h2>
          
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
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0061ff]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-[#0061ff] opacity-70 group-hover:opacity-100 transition-all")} />
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
              "flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
              location.pathname === '/settings' 
                ? "bg-[#F1F5F9] text-[#0061ff]" 
                : "text-slate-500 hover:bg-slate-50 transition-all"
            )}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </Link>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold text-[#E11D48] w-full rounded-2xl bg-[#FFF1F1] hover:bg-[#FFE4E4] transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* Profile Bar at very bottom */}
      <div className="p-6 border-t border-slate-50 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0061ff] to-[#00c6ff] flex items-center justify-center text-white text-xs font-black shadow-lg">
             {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-sm font-black text-[#1e293b] truncate capitalize">{user?.name || 'Admin'}</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'DMC Officer'}</div>
          </div>
      </div>
    </div>
  )
}
