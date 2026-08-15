import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Zap, AlertTriangle, Map, Users, FileText, Activity,
  RefreshCw, ChevronDown, CheckCircle2, XCircle, Loader2,
  Shield, Target, HelpCircle, Wifi, WifiOff, Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiService } from '@/services/api'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import PageMeta from '@/components/common/PageMeta'

// ── Types ─────────────────────────────────────────────────────────────────────
interface HotspotData { district: string; latitude: number; longitude: number; adjusted_severity: number; risk_level: string; incident_count: number; top_category: string; bias_factor: number }
interface SummaryData { full_summary: string; sentences: string[]; incident_count: number; help_request_count: number; critical_count: number; affected_people_estimate: number; flood_warnings: number; severity_breakdown: Record<string, number>; top_districts: string[]; generated_at: string }
interface DriftData { drift_detected: boolean; drift_score: number; drift_level: string; anomalies: string[]; recommendation: string; reports_analysed: number; avg_model_confidence: number }
interface OptimizationData { allocations: any[]; unmet_requests: string[]; pareto_metrics: Record<string, number>; summary: string; total_beneficiaries: number }

// ── Helpers ───────────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOW:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  MINIMAL:  'text-slate-400 bg-slate-500/10 border-slate-500/30',
}

const StatusBadge = ({ level }: { level: string }) => (
  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border', RISK_COLORS[level] || RISK_COLORS.MINIMAL)}>
    {level}
  </span>
)

const MetricBar = ({ value, max = 1, color = 'bg-cyan-500' }: { value: number; max?: number; color?: string }) => (
  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1">
    <div className={cn('h-1.5 rounded-full transition-all', color)} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
)

const SectionCard = ({ title, icon: Icon, children, loading, error, onRefresh }: { title: string; icon: any; children: React.ReactNode; loading?: boolean; error?: string | null; onRefresh?: () => void }) => (
  <div className="bg-white dark:bg-[#131f33] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white/90 text-sm">{title}</h3>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading} className="text-gray-400 dark:text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-40">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      )}
    </div>
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400 mb-0.5">ML service error</p>
            <p className="text-xs text-red-300/70">{error}</p>
          </div>
        </div>
      ) : children}
    </div>
  </div>
)

// ── Sub-components ────────────────────────────────────────────────────────────

function HotspotPanel() {
  const [data, setData] = useState<HotspotData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getHotspots()
      setData(Array.isArray(res.data) ? res.data : [])
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load hotspot data')
      setData([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const displayed = showAll ? data : data.slice(0, 8)
  const high = data.filter(d => ['CRITICAL', 'HIGH'].includes(d.risk_level)).length

  return (
    <SectionCard title="F7 + F8 — Hotspot Forecast & Bias Correction" icon={Map} loading={loading} error={error} onRefresh={load}>
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No hotspot data — no incidents in the last 7 days.</p>
      ) : (
        <>
          <div className="flex gap-4 mb-4 pb-4 border-b border-white/5">
            <div><p className="text-2xl font-black text-red-400">{high}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">High Risk Districts</p></div>
            <div><p className="text-2xl font-black text-white/80">{data.length}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">Districts Analysed</p></div>
          </div>
          <div className="space-y-2">
            {displayed.map(d => (
              <div key={d.district} className="flex items-center gap-3 py-2">
                <div className="w-20 shrink-0">
                  <StatusBadge level={d.risk_level} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-semibold text-white/80 truncate">{d.district}</span>
                    <span className="text-[10px] text-slate-500 ml-2 shrink-0">{d.incident_count} incidents</span>
                  </div>
                  <MetricBar value={d.adjusted_severity} color={d.risk_level === 'CRITICAL' ? 'bg-red-500' : d.risk_level === 'HIGH' ? 'bg-orange-500' : d.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-400'} />
                </div>
                <div className="text-[10px] text-slate-600 w-12 text-right shrink-0">
                  ×{d.bias_factor} bias
                </div>
              </div>
            ))}
          </div>
          {data.length > 8 && (
            <button onClick={() => setShowAll(!showAll)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              {showAll ? 'Show less' : `Show all ${data.length}`} <ChevronDown className={cn('w-3 h-3 transition-transform', showAll && 'rotate-180')} />
            </button>
          )}
          <p className="mt-4 text-[10px] text-slate-600 border-t border-white/5 pt-3">
            Bias-adjusted risk = (raw incident density ÷ urban reporting bias factor) + historical base risk. Higher bias factor = urban over-reporting corrected.
          </p>
        </>
      )}
    </SectionCard>
  )
}

function SituationSummaryPanel() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hours, setHours] = useState(2)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getSituationSummary(hours)
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load situation summary')
      setData(null)
    } finally { setLoading(false) }
  }, [hours])

  useEffect(() => { load() }, [load])

  return (
    <SectionCard title="F16 — Grounded Situation Summary" icon={FileText} loading={loading} error={error} onRefresh={load}>
      <div className="flex gap-2 mb-4">
        {[1, 2, 6, 12, 24].map(h => (
          <button key={h} onClick={() => setHours(h)}
            className={cn('px-3 py-1 rounded-lg text-xs font-bold transition-all',
              hours === h ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
            {h}h
          </button>
        ))}
      </div>
      {!data ? (
        <p className="text-slate-500 text-sm text-center py-4">No data in this time window.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Incidents', value: data.incident_count, color: 'text-blue-400' },
              { label: 'Help Requests', value: data.help_request_count, color: 'text-purple-400' },
              { label: 'Critical', value: data.critical_count, color: 'text-red-400' },
              { label: 'People Affected', value: data.affected_people_estimate, color: 'text-amber-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className={cn('text-xl font-black', m.color)}>{m.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {data.sentences.map((s, i) => (
              <div key={i} className={cn('text-sm leading-relaxed p-3 rounded-xl',
                i === data.sentences.length - 1
                  ? 'bg-amber-500/5 border border-amber-500/15 text-amber-300/70 text-xs'
                  : 'text-slate-300 bg-white/3')}>
                {s}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-600">
            Generated {new Date(data.generated_at).toLocaleString()} · Every sentence grounded in system data.
          </p>
        </>
      )}
    </SectionCard>
  )
}

function DriftPanel() {
  const [data, setData] = useState<DriftData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getDriftStatus(24)
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load drift data')
      setData(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <SectionCard title="F15 — Concept Drift & Emerging Events" icon={Activity} loading={loading} error={error} onRefresh={load}>
      {!data ? (
        <p className="text-slate-500 text-sm text-center py-4">No incident data available for drift analysis.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-5">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center border',
              data.drift_detected ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30')}>
              {data.drift_detected
                ? <AlertTriangle className="w-7 h-7 text-red-400" />
                : <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
            </div>
            <div>
              <p className={cn('text-lg font-black', data.drift_detected ? 'text-red-400' : 'text-emerald-400')}>
                {data.drift_detected ? 'Drift Detected' : 'Model Stable'}
              </p>
              <p className="text-slate-400 text-sm">{data.drift_level} level · {data.reports_analysed} reports analysed</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Drift Score</span>
              <span>{(data.drift_score * 100).toFixed(0)}%</span>
            </div>
            <MetricBar value={data.drift_score} color={data.drift_score > 0.6 ? 'bg-red-500' : data.drift_score > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Avg Model Confidence</span>
              <span>{(data.avg_model_confidence * 100).toFixed(0)}%</span>
            </div>
            <MetricBar value={data.avg_model_confidence} color="bg-cyan-500" />
          </div>
          {data.anomalies.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anomalies</p>
              {data.anomalies.map((a, i) => (
                <div key={i} className="flex gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-300/80">{a}</span>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-white/3 rounded-xl">
            <p className="text-xs text-slate-400">{data.recommendation}</p>
          </div>
        </>
      )}
    </SectionCard>
  )
}

function OptimizationPanel() {
  const [data, setData] = useState<OptimizationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.optimizeResources()
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load optimization data')
      setData(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const metrics = data?.pareto_metrics ?? {}

  return (
    <SectionCard title="F10 — Multi-Objective Resource Allocation" icon={Target} loading={loading} error={error} onRefresh={load}>
      {!data ? (
        <p className="text-slate-500 text-sm text-center py-4">No pending help requests or resources to optimize.</p>
      ) : (
        <>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">{data.summary}</p>
          <div className="space-y-3 mb-5">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white/70 font-bold">{((val as number) * 100).toFixed(0)}%</span>
                </div>
                <MetricBar value={val as number} color={(val as number) > 0.7 ? 'bg-emerald-500' : (val as number) > 0.4 ? 'bg-amber-500' : 'bg-red-400'} />
              </div>
            ))}
          </div>
          {data.allocations.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Allocations ({data.allocations.length})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.allocations.slice(0, 10).map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                    <StatusBadge level={a.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{a.request_type} · {a.people_count} people</p>
                      <p className="text-[10px] text-slate-500 truncate">{a.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.unmet_requests.length > 0 && (
            <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 font-bold">{data.unmet_requests.length} requests unmet — no available resource or volunteer matched.</p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}

function TeamComposerPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disasterType, setDisasterType] = useState('FLOOD')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.composeTeam({ disaster_type: disasterType })
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to compose team')
      setData(null)
    } finally { setLoading(false) }
  }, [disasterType])

  useEffect(() => { load() }, [load])

  const types = ['FLOOD', 'LANDSLIDE', 'FIRE', 'CYCLONE', 'BUILDING_COLLAPSE', 'MEDICAL']

  return (
    <SectionCard title="F12 — Adaptive Team Composition" icon={Users} loading={loading} error={error} onRefresh={load}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {types.map(t => (
          <button key={t} onClick={() => setDisasterType(t)}
            className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
              disasterType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
            {t}
          </button>
        ))}
      </div>
      {!data ? (
        <p className="text-slate-500 text-sm text-center py-4">No volunteers registered to compose a team from.</p>
      ) : (
        <>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-400">{(data.coverage_rate * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Skill Coverage</p>
            </div>
            <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-blue-400">{data.team_size}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Team Size</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {(data.team || []).map((member: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-blue-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate">{member.name}</p>
                  <p className="text-[10px] text-slate-500">{(member.skills_matched || []).join(' · ') || 'General volunteer'} · {member.distance_km} km away</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-cyan-400">{(member.composite_score * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-600">match</p>
                </div>
              </div>
            ))}
          </div>
          {data.skills_uncovered.length > 0 && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400">
                Missing skills: {data.skills_uncovered.join(', ')}
              </p>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">{data.rationale}</p>
        </>
      )}
    </SectionCard>
  )
}

function AnalyzeReportPanel() {
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await aiService.analyzeReport({ text, detected_language: lang })
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const uncertainty = result?.uncertainty
  const multitask = result?.multitask

  const DECISION_COLORS: Record<string, string> = {
    AUTO_CLASSIFY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    REQUEST_CLARIFICATION: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    ESCALATE_TO_HUMAN: 'text-red-400 bg-red-500/10 border-red-500/30',
  }

  return (
    <SectionCard title="F5 + F3 — Multitask Analysis & Uncertainty Triage" icon={Brain} loading={loading} error={error}>
      <div className="space-y-3">
        <div className="flex gap-2 mb-1">
          {['en', 'si', 'ta'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={cn('px-3 py-1 rounded-lg text-[11px] font-bold transition-all',
                lang === l ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
              {l === 'en' ? 'English' : l === 'si' ? 'Sinhala' : 'Tamil'}
            </button>
          ))}
        </div>
        <textarea
          className="w-full bg-[#0a1628] dark:bg-[#0a1628] bg-gray-50 border border-white/10 dark:border-white/10 border-gray-200 text-white/90 dark:text-white/90 text-gray-900 placeholder-slate-600 p-4 rounded-xl font-medium outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
          rows={4}
          placeholder="Enter a disaster report in English, Sinhala, or Tamil to analyse..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button onClick={analyze} disabled={loading || !text.trim()}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Analyse Report
        </button>
      </div>

      {result && (
        <div className="mt-5 space-y-4 border-t border-white/5 pt-5">
          {/* Decision */}
          {uncertainty && (
            <div className={cn('p-3 rounded-xl border flex items-start gap-3', DECISION_COLORS[uncertainty.decision])}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{uncertainty.decision_label}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{uncertainty.explanation}</p>
              </div>
            </div>
          )}

          {/* Multitask outputs */}
          {multitask && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Disaster Type', value: multitask.disaster_type },
                { label: 'Urgency', value: multitask.urgency },
                { label: 'Info Type', value: multitask.information_type },
                { label: 'Required Resource', value: multitask.required_resource },
                { label: 'Vulnerable Group', value: multitask.vulnerable_group },
                { label: 'Infra Damage', value: multitask.infrastructure_damage ? 'YES' : 'NO' },
              ].map(item => (
                <div key={item.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-white/80">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Confidence */}
          {uncertainty && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Calibrated Confidence</span>
                <span className="text-white/70 font-bold">{(uncertainty.calibrated_confidence * 100).toFixed(0)}%</span>
              </div>
              <MetricBar value={uncertainty.calibrated_confidence}
                color={uncertainty.calibrated_confidence >= 0.65 ? 'bg-emerald-500' : uncertainty.calibrated_confidence >= 0.45 ? 'bg-amber-500' : 'bg-red-400'} />
              <p className="text-[10px] text-slate-600 mt-1.5">
                Prediction set: [{uncertainty.prediction_set?.join(', ')}]
              </p>
            </div>
          )}

          {/* Location entities */}
          {multitask?.location_entities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {multitask.location_entities.map((e: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">{e}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function ClarificationPanel() {
  const [text, setText] = useState('')
  const [disasterType, setDisasterType] = useState('FLOOD')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!text.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await aiService.getClarificationQuestions({ text, disaster_type: disasterType })
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to generate questions')
    } finally { setLoading(false) }
  }

  return (
    <SectionCard title="F4 — Clarification Question Generator" icon={HelpCircle} loading={loading} error={error}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 mb-1">
          {['FLOOD', 'LANDSLIDE', 'FIRE', 'CYCLONE', 'MEDICAL', 'DEFAULT'].map(t => (
            <button key={t} onClick={() => setDisasterType(t)}
              className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                disasterType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
              {t}
            </button>
          ))}
        </div>
        <textarea
          className="w-full bg-[#0a1628] border border-white/10 text-white/90 placeholder-slate-600 p-4 rounded-xl font-medium outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
          rows={3}
          placeholder="Paste a short disaster report to generate targeted clarification questions..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button onClick={generate} disabled={loading || !text.trim()}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
          Generate Questions
        </button>
      </div>
      {result && (
        <div className="mt-5 space-y-3 border-t border-white/5 pt-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {result.questions?.length || 0} Clarification Questions
          </p>
          {(result.questions || []).map((q: string, i: number) => (
            <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-300 leading-relaxed">{q}</p>
            </div>
          ))}
          {result.strategy && (
            <p className="text-xs text-slate-500 pt-2 border-t border-white/5">Strategy: <span className="text-cyan-400/70">{result.strategy}</span></p>
          )}
        </div>
      )}
    </SectionCard>
  )
}

// ── R3 — Evidence Graph Verification ─────────────────────────────────────────
function EvidenceGraphPanel() {
  const [reportId, setReportId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = async () => {
    if (!reportId.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await aiService.verifyIncident(reportId.trim())
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  const CRED_COLOR: Record<string, string> = {
    HIGH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    LOW: 'text-red-400 bg-red-500/10 border-red-500/30',
  }

  return (
    <SectionCard title="R3 — Evidence Graph Verification (GAT)" icon={Shield} loading={loading} error={error}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Enter a report ID to verify its credibility using a Graph Attention Network built from multi-source evidence.</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#0a1628] border border-white/10 text-white/90 placeholder-slate-600 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/40"
            placeholder="Report ID (e.g. cm4x...)"
            value={reportId}
            onChange={e => setReportId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
          />
          <button onClick={verify} disabled={loading || !reportId.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Verify
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-5 space-y-4 border-t border-white/5 pt-5">
          {/* Credibility badge */}
          <div className={cn('p-3 rounded-xl border flex items-center gap-3', CRED_COLOR[result.credibility_label] || CRED_COLOR.LOW)}>
            <Shield className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black">{result.credibility_label} CREDIBILITY — {(result.credibility_score * 100).toFixed(0)}%</p>
              <p className="text-[11px] opacity-75 mt-0.5">{result.narrative}</p>
            </div>
          </div>

          {/* Graph stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Graph Nodes', value: result.graph?.node_count ?? '—' },
              { label: 'Graph Edges', value: result.graph?.edge_count ?? '—' },
              { label: 'Evidence Links', value: result.supporting_evidence?.length ?? 0 },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-white/80">{m.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Baseline comparison */}
          {result.baseline_comparison && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Baseline Comparison</p>
              {Object.entries(result.baseline_comparison).map(([k, v]: any) => (
                <div key={k} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">{k.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/5 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${v * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white/70 w-10 text-right">{(v * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top attention weights */}
          {result.gat_details?.top_attention_weights?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Top GAT Attention Weights</p>
              <div className="space-y-1">
                {result.gat_details.top_attention_weights.slice(0, 4).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 font-mono">{a.edge_type}</span>
                    <span className={cn('font-bold', a.contribution >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {a.contribution >= 0 ? '+' : ''}{a.contribution.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

// ── R4 — Active Learning Annotation Queue ────────────────────────────────────
function AnnotationQueuePanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getAnnotationQueue()
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load queue')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const PRIORITY_COLOR: Record<string, string> = {
    URGENT: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH:   'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    LOW:    'text-slate-400 bg-slate-500/10 border-slate-500/30',
  }

  const candidates = data?.ranked_candidates ?? []

  return (
    <SectionCard title="R4 — Active Learning Annotation Queue" icon={Target} loading={loading} error={error} onRefresh={load}>
      {candidates.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No low-confidence reports found — all reports are well-classified.</p>
      ) : (
        <>
          <div className="flex gap-4 mb-4 pb-4 border-b border-white/5">
            <div><p className="text-2xl font-black text-white/80">{data?.total_candidates ?? 0}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">Reports Queued</p></div>
            <div><p className="text-2xl font-black text-red-400">{candidates.filter((c: any) => c.annotation_priority === 'URGENT').length}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">Urgent to Label</p></div>
            <div><p className="text-2xl font-black text-amber-400">{data?.selection_language_distribution?.si ?? 0}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest">Sinhala Reports</p></div>
          </div>
          <div className="space-y-3">
            {candidates.slice(0, 6).map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-[10px] font-black text-slate-600 w-4 pt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border', PRIORITY_COLOR[c.annotation_priority] || PRIORITY_COLOR.LOW)}>
                      {c.annotation_priority}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.language?.toUpperCase()}</span>
                    <span className="text-[10px] text-cyan-400 font-bold ml-auto">score {c.acquisition_score?.toFixed(3)}</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{c.text_preview}</p>
                  {c.annotation_drivers?.[0] && (
                    <p className="text-[10px] text-slate-600 mt-1">{c.annotation_drivers[0]}</p>
                  )}
                  <div className="flex gap-2 mt-1.5 text-[10px] text-slate-600">
                    <span>U={c.components?.U_uncertainty?.toFixed(2)}</span>
                    <span>L={c.components?.L_language_rarity?.toFixed(2)}</span>
                    <span>R={c.components?.R_criticality?.toFixed(2)}</span>
                    <span>E={c.components?.E_explanation_inconsistency?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-600 border-t border-white/5 pt-3">
            Score = 0.30·Uncertainty + 0.20·Diversity + 0.25·Criticality + 0.15·LanguageRarity + 0.10·ExplainInconsistency
          </p>
        </>
      )}
    </SectionCard>
  )
}

// ── R5 — Bias-Aware Spatiotemporal Risk Forecast ─────────────────────────────
function BiasRiskForecastPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getBiasRiskForecast()
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load forecast')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const forecasts: any[] = data?.forecasts ?? []

  return (
    <SectionCard title="R5 — Bias-Aware Spatiotemporal Risk Forecast" icon={Map} loading={loading} error={error} onRefresh={load}>
      {forecasts.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No recent incidents to forecast — submit incident reports first.</p>
      ) : (
        <>
          {data?.summary?.bias_warning && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">{data.summary.bias_warning}</p>
            </div>
          )}
          <div className="space-y-2">
            {forecasts.slice(0, 8).map((f: any, i: number) => {
              const bi = f.bias_info
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-20 shrink-0"><StatusBadge level={f.risk_level} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-semibold text-white/80 truncate">{f.district}</span>
                      <span className="text-[10px] text-slate-500 ml-2 shrink-0">{(f.risk_score * 100).toFixed(0)}%</span>
                    </div>
                    <MetricBar value={f.risk_score} color={f.risk_level === 'CRITICAL' ? 'bg-red-500' : f.risk_level === 'HIGH' ? 'bg-orange-500' : 'bg-amber-400'} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-[10px] font-bold', bi?.is_high_bias ? 'text-amber-400' : 'text-slate-600')}>
                      {bi?.is_high_bias ? '⚠ HIGH BIAS' : `bias ${bi?.bias_factor}`}
                    </p>
                    <p className="text-[10px] text-slate-600">{bi?.bias_level}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-[10px] text-slate-600 border-t border-white/5 pt-3">
            True rate λ̂ = (count + α) ÷ (bias_factor × exposure). CI widens for remote districts. 2-pass spatial GNN propagation applied.
          </p>
        </>
      )}
    </SectionCard>
  )
}

// ── R6 — NSGA-II Relief Coordination ─────────────────────────────────────────
function ReliefCoordinationPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await aiService.getReliefCoordination()
      setData(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to run coordination')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const rec = data?.recommended_plan
  const bc = data?.baseline_comparison
  const meta = data?.nsga2_metadata
  const pareto = data?.pareto_front ?? []

  return (
    <SectionCard title="R6 — NSGA-II Multi-Objective Relief Coordination" icon={Users} loading={loading} error={error} onRefresh={load}>
      {!rec ? (
        <p className="text-slate-500 text-sm text-center py-4">No active help requests — relief coordination requires pending requests.</p>
      ) : (
        <>
          {/* NSGA-II metadata */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Pareto Solutions', value: meta?.n_pareto_solutions ?? '—' },
              { label: 'Generations', value: meta?.generations ?? '—' },
              { label: 'Sites Covered', value: rec.site_allocations?.length ?? '—' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-white/80">{m.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Objective scores */}
          <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended Plan Objectives</p>
            {[
              { label: 'f1 Avg Response Time', value: `${rec.f1_avg_response_time_min?.toFixed(1)} min`, raw: Math.min(rec.f1_avg_response_time_min / 120, 1), color: 'bg-blue-400', invert: true },
              { label: 'f2 Unmet Demand', value: `${(rec.f2_unmet_demand_fraction * 100).toFixed(0)}%`, raw: rec.f2_unmet_demand_fraction, color: 'bg-red-400', invert: true },
              { label: 'f3 Resource Use', value: `${(rec.f3_resource_utilisation * 100).toFixed(0)}%`, raw: rec.f3_resource_utilisation, color: 'bg-emerald-400', invert: false },
            ].map(obj => (
              <div key={obj.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{obj.label}</span>
                  <span className="text-white/70 font-bold">{obj.value}</span>
                </div>
                <MetricBar value={obj.raw} color={obj.color} />
              </div>
            ))}
          </div>

          {/* Baseline comparison */}
          {bc && (
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">vs Baselines (Response Time)</p>
              {[
                { label: 'B1 Greedy', val: bc.B1_greedy?.f1_avg_response_time_min },
                { label: 'B2 Proportional', val: bc.B2_proportional?.f1_avg_response_time_min },
                { label: 'Proposed NSGA-II', val: rec.f1_avg_response_time_min, highlight: true },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className={cn('text-xs w-28 shrink-0', b.highlight ? 'text-cyan-400 font-bold' : 'text-slate-400')}>{b.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div className={cn('h-1.5 rounded-full', b.highlight ? 'bg-cyan-400' : 'bg-slate-600')} style={{ width: `${Math.min((b.val ?? 0) / 120 * 100, 100)}%` }} />
                  </div>
                  <span className={cn('text-xs font-bold w-16 text-right', b.highlight ? 'text-cyan-400' : 'text-slate-500')}>{b.val?.toFixed(1)} min</span>
                </div>
              ))}
            </div>
          )}

          {/* Site allocations */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Site Allocations</p>
            <div className="space-y-1">
              {rec.site_allocations?.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <StatusBadge level={a.severity} />
                  <span className="text-xs text-slate-300 flex-1 truncate">{a.site_id}</span>
                  <span className="text-xs text-cyan-400 font-bold shrink-0">{a.volunteer_teams} team{a.volunteer_teams !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {data?.narrative && (
            <p className="mt-4 text-[10px] text-slate-600 border-t border-white/5 pt-3">{data.narrative}</p>
          )}
        </>
      )}
    </SectionCard>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIResearchPage() {
  const [mlOnline, setMlOnline] = useState<boolean | null>(null)

  useEffect(() => {
    aiService.getHealth()
      .then(r => setMlOnline(r.data?.online === true))
      .catch(() => setMlOnline(false))
  }, [])

  return (
    <div>
      <PageMeta title="AI Research Features — SURAKSHA" />
      <PageBreadcrumb pageTitle="AI Research Features" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white/90">AI Research Features</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">13 advanced AI/ML capabilities integrated into SURAKSHA</p>
            </div>
          </div>

          {/* ML service status pill */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold self-center',
            mlOnline === null ? 'bg-white/5 border-white/10 text-slate-500'
            : mlOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}>
            {mlOnline === null
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking ML service…</>
              : mlOnline
              ? <><Wifi className="w-4 h-4" /> ML Service Online</>
              : <><WifiOff className="w-4 h-4" /> ML Service Offline</>
            }
          </div>
        </div>

        {/* Offline banner with start command */}
        {mlOnline === false && (
          <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-400 mb-1">Python ML service is not running</p>
              <p className="text-xs text-amber-300/70 mb-2">All AI panels require the FastAPI ML service at <code className="bg-black/30 px-1 rounded">http://127.0.0.1:8000</code>. Start it with:</p>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-cyan-300">
                <Terminal className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                cd "Suraksha - Web App/suraksha-ml" &amp;&amp; uvicorn main:app --host 127.0.0.1 --port 8000 --reload
              </div>
            </div>
          </div>
        )}

        {/* Feature index chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'F3 Uncertainty Triage', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            { label: 'F4 Clarification Qs', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            { label: 'F5 Multitask NLP', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
            { label: 'F7 Hotspot Forecast', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            { label: 'F8 Bias Correction', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            { label: 'F10 Resource Optimizer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { label: 'F12 Team Composer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            { label: 'F15 Drift Detection', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
            { label: 'F16 Situation Summary', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
            { label: 'R3 Evidence Graph', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
            { label: 'R4 Active Learning', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
            { label: 'R5 Bias Risk Forecast', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
            { label: 'R6 NSGA-II Coordination', color: 'bg-lime-500/10 text-lime-400 border-lime-500/20' },
          ].map(f => (
            <span key={f.label} className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold border', f.color)}>{f.label}</span>
          ))}
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <AnalyzeReportPanel />
          <ClarificationPanel />
          <TeamComposerPanel />
          <DriftPanel />
          <EvidenceGraphPanel />
          <BiasRiskForecastPanel />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SituationSummaryPanel />
          <OptimizationPanel />
          <HotspotPanel />
          <AnnotationQueuePanel />
          <ReliefCoordinationPanel />
        </div>
      </div>
    </div>
  )
}
