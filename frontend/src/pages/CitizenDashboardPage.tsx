import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { API_URL } from '@/lib/env'
import {
  AlertTriangle, MapPin, HandHelping, UserSearch, ShieldCheck,
  Building2, Bell, Radio, ChevronRight, FileText, HeartPulse,
  QrCode, Shield, Waves
} from 'lucide-react'
import { alertService, campService, missingPersonService, helpRequestService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const ALERT_TYPE_COLOR: Record<string, string> = {
  EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  WARNING:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  INFO:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
}

function QuickActionCard({ icon: Icon, label, description, onClick, color }: {
  icon: any; label: string; description: string; onClick: () => void; color: string
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-auto self-end" />
    </button>
  )
}

const WATER_API = `${API_URL}/water`

interface RiverLevel {
  gaugeId: string; riverName: string; stationName: string; district: string;
  waterLevelMetres: number; alertLevel: number; minorFloodLevel: number;
  majorFloodLevel: number; status: string; trend: string;
}

const RISK_CONFIG: Record<string, { label: string; bar: string; bg: string; border: string; text: string }> = {
  MAJOR_FLOOD: { label: 'Major Flood',  bar: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-300 dark:border-red-800',    text: 'text-red-600 dark:text-red-400' },
  MINOR_FLOOD: { label: 'Minor Flood',  bar: 'bg-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  ALERT:       { label: 'Alert',        bar: 'bg-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400' },
  NORMAL:      { label: 'Normal',       bar: 'bg-cyan-400',   bg: 'bg-muted/30',                         border: 'border-border',                           text: 'text-cyan-600 dark:text-cyan-400' },
}
const riskConfig = (status: string) => RISK_CONFIG[status] || RISK_CONFIG.NORMAL

const trendLabel = (trend: string) =>
  trend === 'RISING' ? '↑ Rising' : trend === 'FALLING' ? '↓ Falling' : '→ Stable'
const trendColor = (trend: string) =>
  trend === 'RISING' ? 'text-red-500' : trend === 'FALLING' ? 'text-green-500' : 'text-muted-foreground'

function WaterLevelWidget() {
  const navigate = useNavigate()
  const [rivers, setRivers] = useState<RiverLevel[]>([])
  const [wLoading, setWLoading] = useState(true)

  useEffect(() => {
    fetch(`${WATER_API}/river`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        // Sort: most critical first
        const order = ['MAJOR_FLOOD', 'MINOR_FLOOD', 'ALERT', 'NORMAL']
        const sorted = [...data].sort((a: RiverLevel, b: RiverLevel) =>
          order.indexOf(a.status) - order.indexOf(b.status)
        )
        setRivers(sorted.slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setWLoading(false))
  }, [])

  const atRisk = rivers.filter(r => r.status !== 'NORMAL').length
  const hasDanger = rivers.some(r => r.status === 'MAJOR_FLOOD' || r.status === 'MINOR_FLOOD')

  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all',
      hasDanger ? 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : 'border-border bg-card'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
            hasDanger ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-blue-100 dark:bg-blue-900/30'
          )}>
            <Waves className={cn('w-4 h-4', hasDanger ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400')} />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">River Water Levels</p>
            <p className="text-xs text-muted-foreground">
              {wLoading ? 'Loading…' : atRisk > 0 ? `${atRisk} river${atRisk > 1 ? 's' : ''} above safe level` : 'All rivers within safe levels'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live</span>
      </div>

      {/* River cards */}
      {wLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : rivers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No river data available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rivers.map(r => {
            const cfg = riskConfig(r.status)
            const max = r.majorFloodLevel * 1.2 || 10
            const pct = Math.min(100, (r.waterLevelMetres / max) * 100)
            return (
              <div key={r.gaugeId} className={cn('rounded-xl border p-3 flex flex-col gap-2', cfg.bg, cfg.border)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{r.riverName}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.stationName}, {r.district}</p>
                  </div>
                  <span className={cn('text-[10px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-full border', cfg.text, cfg.border, cfg.bg)}>
                    {cfg.label}
                  </span>
                </div>

                {/* Level bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{r.waterLevelMetres.toFixed(2)} m</span>
                    <span className={cn('font-bold', trendColor(r.trend))}>{trendLabel(r.trend)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-500', cfg.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Safe limit: {r.minorFloodLevel.toFixed(1)} m · Flood: {r.majorFloodLevel.toFixed(1)} m
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CitizenDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [alerts, setAlerts]       = useState<any[]>([])
  const [camps, setCamps]         = useState<any[]>([])
  const [missing, setMissing]     = useState<any[]>([])
  const [helpReqs, setHelpReqs]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.allSettled([
      alertService.getAlerts(),
      campService.getCamps(),
      missingPersonService.getMissing(),
      helpRequestService.getRequests(),
    ]).then(([a, c, m, h]) => {
      if (a.status === 'fulfilled') setAlerts((a.value.data || []).slice(0, 5))
      if (c.status === 'fulfilled') setCamps((c.value.data || []).filter((x: any) => x.status === 'ACTIVE').slice(0, 4))
      if (m.status === 'fulfilled') setMissing((m.value.data || []).filter((x: any) => x.status === 'MISSING').slice(0, 3))
      if (h.status === 'fulfilled') setHelpReqs((h.value.data || []).slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const isVolunteer = user?.role === 'VOLUNTEER'

  const quickActions = [
    { icon: AlertTriangle, label: 'Report Incident', description: 'Submit a disaster or emergency report', onClick: () => navigate('/incidents'), color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { icon: HandHelping,   label: 'Request Help',    description: 'Ask for emergency assistance',          onClick: () => navigate('/help-requests'), color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { icon: Building2,     label: 'Find Relief Camp', description: 'Locate nearest operational camp',      onClick: () => navigate('/camps'), color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { icon: ShieldCheck,   label: 'Family Safety',   description: 'Check on your family members',         onClick: () => navigate('/family-safety'), color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { icon: UserSearch,    label: 'Missing Persons', description: 'Report or search for missing people',   onClick: () => navigate('/missing-persons'), color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { icon: QrCode,        label: 'Relief Token',    description: 'Access or claim your relief token',    onClick: () => navigate('/tokens'), color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
    { icon: FileText,      label: 'Damage Report',  description: 'Report property or infrastructure damage', onClick: () => navigate('/damage-assessment'), color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { icon: HeartPulse,    label: 'Psych Support',   description: 'Access mental health resources',        onClick: () => navigate('/support'), color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
    ...(isVolunteer ? [{ icon: Shield, label: 'Volunteer Hub', description: 'View tasks and check-in status', onClick: () => navigate('/volunteers'), color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' }] : []),
  ]

  const emergencyAlerts = alerts.filter(a => a.type === 'EMERGENCY' && a.active)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{greeting},</p>
          <h1 className="text-2xl font-black text-foreground">{user?.name || 'Citizen'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full',
              isVolunteer
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            )}>
              {user?.role || 'CITIZEN'}
            </span>
            {user?.region && <span className="text-xs text-muted-foreground">· {user.region}</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/suraksha-alerts')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold text-foreground"
          >
            <Bell className="w-4 h-4" />
            View All Alerts
          </button>
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Live Map
          </button>
        </div>
      </div>

      {/* ── Emergency Alert Banner ── */}
      {emergencyAlerts.length > 0 && (
        <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
              {emergencyAlerts.length} Active Emergency Alert{emergencyAlerts.length > 1 ? 's' : ''}
            </p>
            {emergencyAlerts.slice(0, 2).map(a => (
              <p key={a.id} className="text-sm font-semibold text-red-800 dark:text-red-300 truncate">
                🚨 {a.title} — {a.location}
              </p>
            ))}
          </div>
          <button onClick={() => navigate('/suraksha-alerts')} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline shrink-0">
            View →
          </button>
        </div>
      )}

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts', value: alerts.filter(a => a.active).length, icon: Radio, color: 'text-red-500' },
          { label: 'Relief Camps', value: camps.length, icon: Building2, color: 'text-blue-500' },
          { label: 'Missing Reports', value: missing.length, icon: UserSearch, color: 'text-purple-500' },
          { label: 'Help Requests', value: helpReqs.length, icon: HandHelping, color: 'text-orange-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
            <stat.icon className={cn('w-5 h-5', stat.color)} />
            <div>
              <p className="text-2xl font-black text-foreground">{loading ? '—' : stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <QuickActionCard key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* ── Two-column: Alerts + Camps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Alerts */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Alerts</h2>
            <button onClick={() => navigate('/suraksha-alerts')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No active alerts</div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-xl border text-sm', ALERT_TYPE_COLOR[alert.type] || ALERT_TYPE_COLOR.INFO)}>
                  <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{alert.title}</p>
                    <p className="text-xs opacity-80 truncate">{alert.location} · {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider shrink-0 opacity-70">{alert.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Camps */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Active Relief Camps</h2>
            <button onClick={() => navigate('/camps')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : camps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No active camps</div>
          ) : (
            <div className="space-y-2">
              {camps.map(camp => {
                const pct = camp.totalCapacity ? Math.round((camp.currentOccupancy / camp.totalCapacity) * 100) : 0
                return (
                  <div key={camp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{camp.name}</p>
                      <p className="text-xs text-muted-foreground">{camp.district} · {camp.currentOccupancy}/{camp.totalCapacity} capacity</p>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', pct > 85 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Missing Persons strip ── */}
      {missing.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Missing Persons</h2>
            <button onClick={() => navigate('/missing-persons')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">View all →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {missing.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-sm shrink-0">
                  {p.name?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age ? `Age ${p.age}` : ''} · {p.district || 'Unknown'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Water Level Widget ── */}
      <WaterLevelWidget />

    </div>
  )
}
