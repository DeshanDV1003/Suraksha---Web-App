import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import { io } from 'socket.io-client';

const API = 'http://localhost:3001/api/water';

interface RiverLevel {
  gaugeId: string; riverName: string; stationName: string; district: string;
  latitude: number; longitude: number; waterLevelMetres: number;
  alertLevel: number; minorFloodLevel: number; majorFloodLevel: number;
  status: string; trend: string; changeFromLastHour: number; recordedAt: string;
}
interface RainfallReading {
  stationId: string; stationName: string; district: string;
  rainfallMmPerHour: number; cumulativeRain24h: number; riskLevel: string; recordedAt: string;
}
interface Prediction {
  gaugeId: string; riverName: string; stationName: string; district: string;
  currentLevelM: number; trend: string; changeFromLast: number; alertLevel: string;
  watchThreshold: number;
  prediction: {
    predictedT1M: number; predictedT2M: number; confidence: number;
    alertLevel: string; modelUsed: string; reason: string; predictedAt: string;
  } | null;
}
interface MLStatus { online: boolean; model_loaded?: boolean; status?: string; }

/* ── helpers ── */
const alertColor = (lvl: string) => {
  switch (lvl) {
    case 'CRITICAL':    case 'MAJOR_FLOOD': return { bg: 'bg-red-500/10 dark:bg-red-500/15',    border: 'border-red-400/40 dark:border-red-500/30',    text: 'text-red-500 dark:text-red-400',    badge: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-400/40 dark:border-red-500/30' };
    case 'WARNING':     case 'MINOR_FLOOD': return { bg: 'bg-amber-500/10 dark:bg-amber-500/15',  border: 'border-amber-400/40 dark:border-amber-500/30',  text: 'text-amber-600 dark:text-amber-400',  badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40 dark:border-amber-500/30' };
    case 'WATCH':       case 'ALERT':       return { bg: 'bg-yellow-400/10 dark:bg-yellow-400/10', border: 'border-yellow-400/40 dark:border-yellow-400/30', text: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border-yellow-400/40 dark:border-yellow-400/30' };
    default:                                return { bg: 'bg-cyan-400/5 dark:bg-cyan-400/5',    border: 'border-cyan-400/20 dark:border-cyan-400/10',   text: 'text-cyan-600 dark:text-cyan-400',   badge: 'bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 border-cyan-400/30 dark:border-cyan-400/20' };
  }
};
const confColor = (c: number) => c >= 0.85 ? 'text-emerald-500 dark:text-emerald-400' : c >= 0.75 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-500 dark:text-amber-400';
const trendIcon = (t: string, chg: number) => {
  if (t === 'RISING' || chg > 0.05) return <span className="text-red-500 dark:text-red-400">↑</span>;
  if (t === 'FALLING' || chg < -0.05) return <span className="text-emerald-500 dark:text-emerald-400">↓</span>;
  return <span className="text-slate-400">→</span>;
};

/* ── Confidence Ring ── */
function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 22, circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const color = pct >= 85 ? '#34d399' : pct >= 75 ? '#22d3ee' : '#fbbf24';
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-white/5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ── Level Bar ── */
function LevelBar({ current, watch, minor, major, predicted }: {
  current: number; watch: number; minor: number; major: number; predicted?: number;
}) {
  const max = major * 1.2;
  const pct = (v: number) => Math.min(100, (v / max) * 100);
  return (
    <div className="relative w-full h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-visible mt-1">
      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct(current)}%`,
          background: current >= major ? '#ef4444' : current >= minor ? '#f59e0b' : current >= watch ? '#facc15' : '#22d3ee'
        }} />
      {predicted !== undefined && (
        <div className="absolute top-[-3px] w-[3px] h-[18px] rounded bg-slate-500 dark:bg-white/60"
          style={{ left: `${pct(predicted)}%`, transition: 'left 0.5s' }} />
      )}
      {[watch, minor, major].map((v, i) => (
        <div key={i} className="absolute top-[-2px] w-[1px] h-[16px] opacity-40"
          style={{ left: `${pct(v)}%`, background: ['#facc15', '#f59e0b', '#ef4444'][i] }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function WaterMonitorPage() {
  const { t } = useTranslation();
  const [predictions, setPredictions]   = useState<Prediction[]>([]);
  const [rainfallData, setRainfallData] = useState<RainfallReading[]>([]);
  const [riverData, setRiverData]       = useState<RiverLevel[]>([]);
  const [mlStatus, setMlStatus]         = useState<MLStatus>({ online: false });
  const [lastUpdated, setLastUpdated]   = useState(new Date());
  const [loading, setLoading]           = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState<'ai' | 'river' | 'rainfall'>('ai');

  const fetchAll = useCallback(async () => {
    try {
      const [predRes, rainRes, riverRes, mlRes] = await Promise.allSettled([
        fetch(`${API}/predictions`),
        fetch(`${API}/rainfall`),
        fetch(`${API}/river`),
        fetch(`${API}/ml-status`),
      ]);
      if (predRes.status === 'fulfilled' && predRes.value.ok)   setPredictions(await predRes.value.json());
      if (rainRes.status === 'fulfilled' && rainRes.value.ok)   setRainfallData(await rainRes.value.json());
      if (riverRes.status === 'fulfilled' && riverRes.value.ok) setRiverData(await riverRes.value.json());
      if (mlRes.status === 'fulfilled'  && mlRes.value.ok)      setMlStatus(await mlRes.value.json());
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const socket = io('http://localhost:3001/water');
    socket.on('water_data_updated', fetchAll);
    return () => { socket.disconnect(); };
  }, [fetchAll]);

  const triggerPrediction = async () => {
    setTriggerLoading(true);
    try {
      await fetch(`${API}/trigger-prediction`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      await fetchAll();
    } finally { setTriggerLoading(false); }
  };

  /* ── derived stats ── */
  const activeAlerts    = predictions.filter(p => p.prediction?.alertLevel && p.prediction.alertLevel !== 'NONE').length;
  const criticalAlerts  = predictions.filter(p => p.prediction?.alertLevel === 'CRITICAL').length;
  const avgConf         = predictions.length
    ? predictions.reduce((s, p) => s + (p.prediction?.confidence ?? 0), 0) / predictions.length
    : 0;

  /* ── top-level alert gauges (sorted by severity) ── */
  const alertGauges = predictions
    .filter(p => p.prediction?.alertLevel && p.prediction.alertLevel !== 'NONE')
    .sort((a, b) => {
      const rank = { CRITICAL: 3, WARNING: 2, WATCH: 1, NONE: 0 };
      return (rank[b.prediction?.alertLevel as keyof typeof rank] ?? 0) - (rank[a.prediction?.alertLevel as keyof typeof rank] ?? 0);
    });

  return (
    <div className="space-y-6">
      <PageMeta title={`${t('water_monitor_page.title')} | Suraksha`} description="AI-powered river level monitoring and flood prediction" />
      <PageBreadcrumb pageTitle={t('nav.water_monitor') || 'Water Monitor'} />

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('water_monitor_page.title')}</h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${mlStatus.online ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-500/30'}`}>
              {mlStatus.online ? `⚡ LSTM ${mlStatus.model_loaded ? t('water_monitor_page.lstm_active') : t('water_monitor_page.fallback')}` : `⚫ ${t('water_monitor_page.ml_offline')}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('water_monitor_page.last_updated')} <span className="text-slate-700 dark:text-slate-200 font-medium">{lastUpdated.toLocaleTimeString()}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="px-4 py-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 border border-cyan-400/30 dark:border-cyan-400/20 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-400/10 transition-all">
            ↻ {t('water_monitor_page.refresh')}
          </button>
          <button onClick={triggerPrediction} disabled={triggerLoading}
            className="px-4 py-2 text-xs font-bold bg-cyan-500 text-white rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center gap-2">
            {triggerLoading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('water_monitor_page.running')}</> : `🤖 ${t('water_monitor_page.run_ai')}`}
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('water_monitor_page.gauges_monitored'), value: predictions.length, icon: '📡', color: 'text-cyan-600 dark:text-cyan-400' },
          { label: t('water_monitor_page.active_alerts'),    value: activeAlerts,       icon: '⚠️', color: activeAlerts > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
          { label: t('water_monitor_page.critical'),         value: criticalAlerts,     icon: '🚨', color: criticalAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
          { label: t('water_monitor_page.avg_confidence'),   value: `${Math.round(avgConf * 100)}%`, icon: '🧠', color: confColor(avgConf) },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 shadow-sm flex items-center gap-4">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Alerts Banner ── */}
      {alertGauges.length > 0 && (
        <div className="p-4 rounded-2xl border border-red-400/30 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5">
          <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-3 uppercase tracking-widest">⚠ {t('water_monitor_page.active_flood_predictions')}</div>
          <div className="space-y-2">
            {alertGauges.map(g => {
              const c = alertColor(g.prediction!.alertLevel);
              return (
                <div key={g.gaugeId} className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>{g.prediction!.alertLevel}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{g.riverName} @ {g.stationName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{g.district}</span>
                  <span className={`text-xs ml-auto ${c.text}`}>
                    {t('water_monitor_page.t1hr')} <b>{g.prediction!.predictedT1M.toFixed(2)}m</b> → {t('water_monitor_page.t2hr')} <b>{g.prediction!.predictedT2M.toFixed(2)}m</b>
                  </span>
                  <ConfidenceRing value={g.prediction!.confidence} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-cyan-400/10">
        {(['ai', 'river', 'rainfall'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-[#131f33] text-cyan-600 dark:text-cyan-400 border border-b-0 border-slate-200 dark:border-cyan-400/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            {tab === 'ai' ? `🤖 ${t('water_monitor_page.tabs.ai_predictions')}` : tab === 'river' ? `🌊 ${t('water_monitor_page.tabs.river_gauges')}` : `🌧 ${t('water_monitor_page.tabs.rainfall')}`}
          </button>
        ))}
      </div>

      {/* ── AI PREDICTIONS TAB ── */}
      {activeTab === 'ai' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-slate-100 dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {predictions.map(p => {
                const pred = p.prediction;
                const lvl  = pred?.alertLevel ?? 'NORMAL';
                const c    = alertColor(lvl !== 'NONE' ? lvl : p.alertLevel);
                return (
                  <div key={p.gaugeId}
                    className={`p-5 rounded-2xl border ${c.bg} ${c.border} bg-white dark:bg-[#131f33] transition-all hover:border-opacity-50 relative overflow-hidden`}>
                    {lvl === 'CRITICAL' && <div className="absolute -top-6 -right-6 w-20 h-20 bg-red-500 rounded-full blur-3xl opacity-10 pointer-events-none" />}

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.riverName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{p.stationName} · {p.district}</div>
                      </div>
                      {pred && <ConfidenceRing value={pred.confidence} />}
                    </div>

                    <div className="flex items-end gap-2 mb-2">
                      <span className={`text-3xl font-bold ${c.text}`}>{p.currentLevelM.toFixed(2)}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('water_monitor_page.m_current')}</span>
                      <span className="ml-auto text-lg">{trendIcon(p.trend, p.changeFromLast)}</span>
                    </div>

                    <LevelBar
                      current={p.currentLevelM}
                      watch={p.watchThreshold}
                      minor={predictions.find(x => x.gaugeId === p.gaugeId) ? (p.watchThreshold * 1.3) : p.watchThreshold}
                      major={p.watchThreshold * 1.8}
                      predicted={pred?.predictedT1M}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 mb-3">
                      <span>{t('water_monitor_page.watch')} {p.watchThreshold.toFixed(1)}m</span>
                      {pred && <span className="text-slate-600 dark:text-slate-300">{t('water_monitor_page.predicted_marker')}</span>}
                    </div>

                    {pred ? (
                      <>
                        <div className="flex gap-2 mb-3">
                          <div className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t('water_monitor_page.t1hr_label')}</div>
                            <div className={`text-sm font-bold ${pred.predictedT1M > p.watchThreshold ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-100'}`}>
                              {pred.predictedT1M.toFixed(2)} m
                            </div>
                          </div>
                          <div className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{t('water_monitor_page.t2hr_label')}</div>
                            <div className={`text-sm font-bold ${pred.predictedT2M > p.watchThreshold ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-100'}`}>
                              {pred.predictedT2M.toFixed(2)} m
                            </div>
                          </div>
                          <div className="flex items-center justify-center px-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${alertColor(pred.alertLevel).badge}`}>
                              {pred.alertLevel === 'NONE' ? 'SAFE' : pred.alertLevel}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          📊 {pred.reason}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                          {t('water_monitor_page.model')} {pred.modelUsed} · {pred.confidence < 0.75 ? `⚠ ${t('water_monitor_page.low_confidence')}` : `✓ ${t('water_monitor_page.alert_threshold')}`}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500 italic">
                        {t('water_monitor_page.connect_ml')}
                      </div>
                    )}
                  </div>
                );
              })}
              {predictions.length === 0 && !loading && (
                <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500">
                  <div className="text-4xl mb-3">🤖</div>
                  <div className="font-semibold">{t('water_monitor_page.no_predictions')}</div>
                  <div className="text-sm mt-1">{t('water_monitor_page.click_run_ai')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RIVER GAUGES TAB ── */}
      {activeTab === 'river' && (
        <div className="rounded-2xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-cyan-400/10 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-50 dark:bg-white/[0.02]">
                  {[t('water_monitor_page.river_station'), t('water_monitor_page.district'), t('water_monitor_page.level_m'), t('water_monitor_page.change'), t('water_monitor_page.trend'), t('water_monitor_page.alert_level'), t('water_monitor_page.status')].map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riverData.slice(0, 20).map((r, i) => {
                  const c = alertColor(r.status);
                  return (
                    <tr key={i} className={`border-b border-slate-100 dark:border-cyan-400/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${r.status === 'MAJOR_FLOOD' ? 'bg-red-50 dark:bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{r.riverName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.stationName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.district}</td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${c.text}`}>{r.waterLevelMetres.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">m</span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${r.changeFromLastHour > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {r.changeFromLastHour > 0 ? '+' : ''}{r.changeFromLastHour.toFixed(2)}m
                      </td>
                      <td className="px-4 py-3">{trendIcon(r.trend, r.changeFromLastHour)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{r.alertLevel.toFixed(1)}m</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.badge}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {riverData.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">{t('water_monitor_page.no_river_data')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RAINFALL TAB ── */}
      {activeTab === 'rainfall' && (
        <div className="rounded-2xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-cyan-400/10 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-50 dark:bg-white/[0.02]">
                  {[t('water_monitor_page.station'), t('water_monitor_page.district'), t('water_monitor_page.current_mmhr'), t('water_monitor_page.total_24h'), t('water_monitor_page.risk')].map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rainfallData.slice(0, 20).map((s, i) => {
                  const c = alertColor(s.riskLevel);
                  return (
                    <tr key={i} className="border-b border-slate-100 dark:border-cyan-400/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{s.stationName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.district}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/5 rounded-full">
                            <div className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400 transition-all"
                              style={{ width: `${Math.min(100, (s.rainfallMmPerHour / 100) * 100)}%` }} />
                          </div>
                          <span className="text-slate-700 dark:text-slate-200 font-semibold w-14 text-right">{s.rainfallMmPerHour.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.cumulativeRain24h.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.badge}`}>{s.riskLevel}</span>
                      </td>
                    </tr>
                  );
                })}
                {rainfallData.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">{t('water_monitor_page.no_rainfall_data')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Setup guide (when ML offline) ── */}
      {!mlStatus.online && (
        <div className="p-5 rounded-2xl border border-amber-400/30 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">🔧 {t('water_monitor_page.ml_setup_guide')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
            <div>1. <span className="text-cyan-600 dark:text-cyan-300">cd suraksha-ml && pip install tensorflow scikit-learn</span></div>
            <div>2. <span className="text-cyan-600 dark:text-cyan-300">python training/train_lstm.py</span>  ← generates model files (~5 min)</div>
            <div>3. <span className="text-cyan-600 dark:text-cyan-300">uvicorn main:app --port 8000</span>  ← starts prediction API</div>
            <div className="pt-1 text-slate-400 dark:text-slate-500">Then click "Run AI Prediction" above to see LSTM predictions.</div>
          </div>
        </div>
      )}
    </div>
  );
}
