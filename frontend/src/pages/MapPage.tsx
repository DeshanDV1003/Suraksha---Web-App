import React, { useState, useEffect, useRef } from 'react';
import { useDialog } from '@/components/ui/dialogs/DialogProvider';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap, Circle, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  Layers, Zap, Search, Shield, AlertTriangle, TrendingUp, Activity,
  Heart, Home, Play, Pause, Navigation, Clock, User, ShieldCheck,
  Route, ChevronDown, Loader2, CheckCircle, AlertCircle, XCircle, MapPin as MapPinIcon
} from 'lucide-react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { mapService } from "@/services/api";

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];
const SRI_LANKA_BOUNDS: [[number, number], [number, number]] = [[5.9, 79.5], [9.9, 81.9]];
const DEFAULT_ZOOM = 8;

interface Incident {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  zoneId?: string;
  zoneName?: string;
  province?: string;
  createdAt?: string;
}

interface Camp {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  currentOccupancy: number;
  totalCapacity: number;
  status: string;
}

// dynamic pin icon creator
function createPinIcon(severity: string, category: string) {
  const colors: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e'
  };
  const color = colors[severity] || '#6366f1';
  let symbol = '•';
  const cat = category?.toUpperCase();
  if (cat === 'FLOOD') symbol = '💧';
  else if (cat === 'LANDSLIDE') symbol = '⛰️';
  else if (cat === 'STORM' || cat === 'CYCLONE') symbol = '🌪️';
  else if (cat === 'FIRE') symbol = '🔥';
  else if (cat === 'MEDICAL') symbol = '🚨';

  return L.divIcon({
    className: '',
    html: `
      <div style="width: 32px; height: 32px; background: ${color}; border: 2.5px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; position: relative;">
        <div style="transform: rotate(45deg); font-size: 13px; margin-top: -1px; margin-left: -1px;">${symbol}</div>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  });
}

// custom icon for safety hubs/camps
const createCampIcon = () => {
  return L.divIcon({
    className: '',
    html: `
      <div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 10px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transform: rotate(45deg);">
        <div style="transform: rotate(-45deg); font-size: 14px; color: white; font-weight: bold;">🏕️</div>
      </div>
    `,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18]
  });
};

const createVolunteerIcon = (skill: string) => {
  const colors: Record<string, string> = { 'Medical': '#ef4444', 'Rescue': '#f97316', 'General': '#3b82f6' };
  const color = colors[skill] || '#3b82f6';
  return L.divIcon({
    className: '',
    html: `
      <div style="width: 14px; height: 14px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color}80; position: relative;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; border: 1px solid ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
    `,
    iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10]
  });
};

function MapAddressSearch({ onLocationFound }: { onLocationFound: (loc: any) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + ', Sri Lanka')}&countrycodes=lk&format=json&limit=5&addressdetails=1`);
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setQuery(val); setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 450);
  };

  const handleGeocodeSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setSuggestions([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/location/geocode', { address: query }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data && response.data.latitude) {
        map.flyTo([response.data.latitude, response.data.longitude], 13, { duration: 1.6 });
        onLocationFound(response.data);
      } else setError('Location not resolved in Sri Lanka.');
    } catch (err: any) { setError(err.response?.data?.error || 'Geocoding search failed.'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="absolute top-6 left-6 z-[1000] w-full max-w-sm font-sans">
      <div className="flex bg-white dark:bg-[#1a2540] rounded-[1.25rem] shadow-2xl border border-gray-200 dark:border-slate-600/50 p-2 gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/25">
        <div className="flex items-center pl-2 text-gray-400 dark:text-slate-400"><Search className="w-4 h-4" /></div>
        <input value={query} onChange={handleInput} placeholder="Search town, road, city or zone..." className="flex-1 bg-transparent px-1 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500" onKeyDown={(e) => e.key === 'Enter' && handleGeocodeSearch()} />
        <button onClick={handleGeocodeSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl px-4 py-2 transition-colors disabled:opacity-50">{loading ? '...' : 'Go'}</button>
      </div>
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-[#1a2540] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-600/50 mt-2 overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div key={idx} onClick={() => { const lat = parseFloat(s.lat); const lon = parseFloat(s.lon); setQuery(s.display_name.split(',')[0]); setSuggestions([]); map.flyTo([lat, lon], 14, { duration: 1.3 }); onLocationFound({ latitude: lat, longitude: lon, displayName: s.display_name }); }} className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">📍</span><span className="truncate">{s.display_name}</span>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-3 mt-2 text-[10px] font-bold border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Mock Data Generators for New Features
// Cyclone cone bounded within Sri Lanka's eastern coast (lng max 81.9)
const MOCK_CYCLONE_CONE: [number, number][] = [
  [8.8, 81.0], [8.2, 81.5], [7.8, 81.7], [7.2, 81.8], [6.8, 81.5], [7.2, 81.0], [7.8, 80.8], [8.4, 80.8]
];

const generateMockVolunteers = (incidents: Incident[]) => {
  return incidents.slice(0, 10).map((inc, i) => ({
    id: `vol-${i}`,
    name: `Volunteer ${i + 1}`,
    skill: i % 3 === 0 ? 'Medical' : i % 3 === 1 ? 'Rescue' : 'General',
    latitude: inc.latitude + (Math.random() - 0.5) * 0.05,
    longitude: inc.longitude + (Math.random() - 0.5) * 0.05,
    status: 'ACTIVE'
  }));
};

const generateEvacRoutes = () => {
  // Mock routes near Colombo
  return {
    primary: [[6.92, 79.86], [6.95, 79.90], [6.97, 79.95], [7.0, 80.0]] as [number, number][],
    alternate: [[6.92, 79.86], [6.88, 79.90], [6.90, 79.98], [7.0, 80.0]] as [number, number][]
  };
};

const generateAssignmentArrows = (camps: Camp[], incidents: Incident[]) => {
  const arrows: { id: string; positions: [number, number][] }[] = [];
  if (camps.length === 0 || incidents.length === 0) return arrows;
  // Only draw arrows between a camp and the nearest incident within 0.4° (~44 km)
  for (let i = 0; i < Math.min(5, camps.length); i++) {
    const camp = camps[i];
    if (!camp.latitude || !camp.longitude) continue;
    const nearby = incidents.find(inc =>
      inc.latitude && inc.longitude &&
      Math.abs(inc.latitude - camp.latitude!) < 0.4 &&
      Math.abs(inc.longitude - camp.longitude!) < 0.4
    );
    if (nearby) {
      arrows.push({
        id: `arrow-${i}`,
        positions: [[camp.latitude, camp.longitude], [nearby.latitude!, nearby.longitude!]],
      });
    }
  }
  return arrows;
};

export default function MapPage() {
  const { alert } = useDialog()
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [districtGeoJSON, setDistrictGeoJSON] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [searchedPin, setSearchedPin] = useState<any | null>(null);
  const [mapMode, setMapMode] = useState<'incidents' | 'zones'>('incidents');
  
  // New Feature States
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [evacRoutes, setEvacRoutes] = useState<any>(null);
  const [assignmentArrows, setAssignmentArrows] = useState<any[]>([]);
  const [isExportingRoute, setIsExportingRoute] = useState(false);

  const handleExportRoute = async () => {
    if (!evacRoutes) return;
    setIsExportingRoute(true);
    try {
      const response = await mapService.exportRoutePdf(evacRoutes);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Evacuation_Route_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export route PDF', error);
      await alert('Failed to export route. Please try again.', { variant: 'danger', title: 'Export failed' });
    } finally {
      setIsExportingRoute(false);
    }
  };
  
  // Historical Scrubber
  const [timeScrubber, setTimeScrubber] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrubberInterval = useRef<NodeJS.Timeout | null>(null);

  const [layers, setLayers] = useState({
    incidents: true,
    riskZones: true,
    reliefCamps: true,
    safeZones: true,
    volunteers: true,
    weatherProjections: false,
    evacuationRoutes: false,
    assignmentArrows: false,
    safeRoutes: false,
  });

  // Safe route state
  const [routeFinderOpen, setRouteFinderOpen] = useState(false);
  const [routeFromLat, setRouteFromLat] = useState('');
  const [routeFromLng, setRouteFromLng] = useState('');
  const [routeDestType, setRouteDestType] = useState<'SAFE_ZONE' | 'CAMP' | 'CUSTOM'>('SAFE_ZONE');
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);

  const handleComputeRoutes = async () => {
    const lat = parseFloat(routeFromLat);
    const lng = parseFloat(routeFromLng);
    if (isNaN(lat) || isNaN(lng)) { setRouteError('Enter valid coordinates for your start location.'); return; }
    setRouteLoading(true); setRouteError(''); setRouteData(null);
    try {
      const res = await mapService.getSafeRoute({ fromLat: lat, fromLng: lng, destType: routeDestType });
      setRouteData(res.data);
      setSelectedRouteIdx(0);
    } catch (e: any) {
      setRouteError(e.response?.data?.message || 'Failed to compute routes. Try again.');
    } finally { setRouteLoading(false); }
  };

  // Safe zone danger zones state
  const [activeDangerZones, setActiveDangerZones] = useState<any[]>([]);

  useEffect(() => {
    const fetchSafeZones = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/api/safe-zones/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveDangerZones(res.data?.data || []);
      } catch { /* non-critical */ }
    };
    fetchSafeZones();
    const interval = setInterval(fetchSafeZones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [incRes, campRes] = await Promise.all([
          axios.get('http://localhost:3001/api/incidents', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3001/api/camps', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        // Add fake created dates for historical replay if missing
        const incs = incRes.data.map((inc: any, idx: number) => ({
          ...inc,
          createdAt: inc.createdAt || new Date(Date.now() - (100 - idx) * 3600000).toISOString()
        })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        setIncidents(incs);
        setCamps(campRes.data);
        setEvacRoutes(generateEvacRoutes());
        setAssignmentArrows(generateAssignmentArrows(campRes.data, incs));

        // Real volunteer positions — falls back to empty array silently
        try {
          const volRes = await axios.get('http://localhost:3001/api/location/field-team', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVolunteers(volRes.data || []);
        } catch { setVolunteers([]); }
      } catch (err) {
        console.error('Failed to load static datasets for map:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (incidents.length === 0) return;
    fetch('/srilanka_districts.geojson')
      .then((res) => res.json())
      .then((data) => {
        const densityCounts: Record<string, number> = {};
        incidents.forEach((inc) => {
          if (inc.zoneId) densityCounts[inc.zoneId] = (densityCounts[inc.zoneId] || 0) + 1;
        });
        const maxIncidents = Math.max(...Object.values(densityCounts), 1);
        data.features.forEach((feat: any) => {
          const count = densityCounts[feat.properties.ADM2_PCODE] || 0;
          feat.properties.ZONE_ID = feat.properties.ADM2_PCODE;
          feat.properties.ZONE_NAME = feat.properties.ADM2_EN;
          feat.properties.PROVINCE = feat.properties.ADM1_EN;
          feat.properties.RISK_SCORE = count / maxIncidents;
        });
        setDistrictGeoJSON(data);
      })
      .catch((e) => console.error('Failed to parse boundaries:', e));
  }, [incidents]);

  useEffect(() => {
    if (isPlaying) {
      scrubberInterval.current = setInterval(() => {
        setTimeScrubber(prev => {
          if (prev >= 100) { setIsPlaying(false); return 100; }
          return prev + 1;
        });
      }, 100);
    } else {
      if (scrubberInterval.current) clearInterval(scrubberInterval.current);
    }
    return () => { if (scrubberInterval.current) clearInterval(scrubberInterval.current); };
  }, [isPlaying]);

  const getZoneStyle = (feature: any) => {
    const isSelected = feature.properties.ZONE_ID === selectedZone?.zoneId;
    const isHovered = feature.properties.ZONE_ID === hoveredZoneId;
    const risk = feature.properties.RISK_SCORE || 0;
    let fillColor = '#10b981';
    if (risk > 0.65) fillColor = '#ef4444';
    else if (risk > 0.35) fillColor = '#f97316';
    else if (risk > 0.08) fillColor = '#f59e0b';

    return {
      fillColor, fillOpacity: isSelected ? 0.45 : isHovered ? 0.3 : 0.1,
      color: isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#cbd5e1',
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      dashArray: isSelected ? undefined : '3 4'
    };
  };

  const handleZoneClick = (feature: any) => {
    const props = feature.properties;
    const zoneIncidents = incidents.filter((i) => i.zoneId === props.ZONE_ID);
    setSelectedZone({
      zoneId: props.ZONE_ID, zoneName: props.ZONE_NAME, province: props.PROVINCE,
      riskScore: props.RISK_SCORE || 0, incidentCount: zoneIncidents.length,
      criticalCount: zoneIncidents.filter((i) => i.severity === 'CRITICAL').length,
    });
  };

  // Filter incidents based on scrubber (0 = first incident, 100 = all incidents)
  const visibleIncidentCount = Math.max(1, Math.floor((timeScrubber / 100) * incidents.length));
  const activeIncidents = incidents.slice(0, visibleIncidentCount).filter((i) => i.latitude && i.longitude);

  return (
        <>
          <PageMeta title="Live Map | Suraksha" description="Suraksha Live Map Page" />
          <PageBreadcrumb pageTitle="Live Map" />
          <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans h-full pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            
            
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('map_page.live_monitoring')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="suraksha-card p-6 flex flex-col gap-4">
              <h3 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                <Activity className="w-4 h-4 text-blue-500" /><span>{t('map_page.ops_summary')}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white">{activeIncidents.length}</span>
                  <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest mt-1">{t('map_page.total_incidents')}</span>
                </div>
                <div className="bg-red-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white">{activeIncidents.filter((i) => ['CRITICAL', 'HIGH'].includes(i.severity)).length}</span>
                  <span className="text-[9px] font-black text-red-100 uppercase tracking-widest mt-1">{t('map_page.critical_high')}</span>
                </div>
                <div className="bg-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white">{camps.length}</span>
                  <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mt-1">{t('map_page.active_support_camps')}</span>
                </div>
                <div className="bg-violet-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white">{activeIncidents.filter((i) => i.severity === 'CRITICAL').length}</span>
                  <span className="text-[9px] font-black text-violet-100 uppercase tracking-widest mt-1">Critical Only</span>
                </div>
              </div>

              <div className="space-y-3 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">{t('map_page.risk_coverage_index')}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">94.2%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '94.2%' }} />
                </div>
              </div>
            </div>

            {/* Safe Zones Panel */}
            {activeDangerZones.length > 0 && (
              <div className="suraksha-card p-5 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20">
                <h3 className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" /> Active Flood Alerts &amp; Safe Zones
                </h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {activeDangerZones.map((zone: any) => (
                    <div key={zone.gaugeId} className="bg-white dark:bg-gray-900/80 rounded-xl p-3 border border-red-100 dark:border-red-900/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-md ${zone.alertLevel === 'CRITICAL' ? 'bg-red-500' : zone.alertLevel === 'WARNING' ? 'bg-orange-500' : 'bg-yellow-500'}`}>{zone.alertLevel}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{zone.district}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 truncate">{zone.riverName} @ {zone.stationName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Danger radius: {zone.dangerRadiusKm} km</p>
                      {zone.safeZones && zone.safeZones.filter((z: any) => !z.isInDangerZone).slice(0, 2).map((sz: any) => (
                        <a key={sz.id} href={sz.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-emerald-700 hover:underline mt-1 font-semibold">
                          <span>🛡</span><span className="truncate">{sz.name} ({sz.distanceKm} km)</span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Safe Route Finder Panel ──────────────────────────────── */}
            {layers.safeRoutes && (
              <div className="suraksha-card p-5 border-l-4 border-l-emerald-500">
                <button
                  onClick={() => setRouteFinderOpen(o => !o)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Route className="w-4 h-4" /> Safe Route Finder
                  </h3>
                  <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', routeFinderOpen && 'rotate-180')} />
                </button>

                {routeFinderOpen && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Your Location (from search or manual)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Lat e.g. 6.927"
                          value={routeFromLat}
                          onChange={e => setRouteFromLat(e.target.value)}
                          className="bg-[#0f172a] border border-cyan-400/20 text-slate-100 text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                        <input
                          type="number"
                          placeholder="Lng e.g. 79.861"
                          value={routeFromLng}
                          onChange={e => setRouteFromLng(e.target.value)}
                          className="bg-[#0f172a] border border-cyan-400/20 text-slate-100 text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Tip: Search a location above to auto-fill.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Route To</label>
                      <select
                        value={routeDestType}
                        onChange={e => setRouteDestType(e.target.value as any)}
                        className="w-full bg-[#0f172a] border border-cyan-400/20 text-slate-100 text-xs rounded-xl px-3 py-2 appearance-none focus:outline-none"
                      >
                        <option value="SAFE_ZONE">Nearest Safe Zone (Public Place)</option>
                        <option value="CAMP">Nearest Relief Camp</option>
                      </select>
                    </div>

                    {routeError && (
                      <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {routeError}
                      </p>
                    )}

                    <button
                      onClick={handleComputeRoutes}
                      disabled={routeLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {routeLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating…</> : <><Route className="w-3.5 h-3.5" /> Find Safe Routes</>}
                    </button>

                    {/* Route results */}
                    {routeData && (
                      <div className="space-y-2 mt-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Destination: <span className="text-emerald-400">{routeData.destination.name}</span>
                          {' '}· {routeData.directDistKm} km straight-line
                        </p>
                        {routeData.routes.map((route: any, idx: number) => {
                          const isSelected = idx === selectedRouteIdx;
                          const riskColors: Record<string, string> = {
                            LOW: 'text-emerald-400', MODERATE: 'text-amber-400',
                            HIGH: 'text-orange-400', CRITICAL: 'text-red-400',
                          };
                          const RiskIcon = route.risk === 'LOW' ? CheckCircle : route.risk === 'MODERATE' ? AlertCircle : XCircle;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedRouteIdx(idx)}
                              className={cn(
                                'w-full text-left p-3 rounded-xl border transition-all',
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-400/40'
                                  : 'bg-[#0f172a] border-slate-700/50 hover:border-slate-500',
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-200">{route.name}</span>
                                <span className={cn('text-[9px] font-black uppercase', riskColors[route.risk])}>
                                  {route.risk}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1.5">
                                {/* Score bar */}
                                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', route.score >= 80 ? 'bg-emerald-400' : route.score >= 60 ? 'bg-amber-400' : route.score >= 40 ? 'bg-orange-400' : 'bg-red-500')}
                                    style={{ width: `${route.score}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-300 w-8 text-right">{route.score}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold">
                                <span>{route.estimatedKm} km</span>
                                {route.hazardsNearby.length > 0 ? (
                                  <span className="text-amber-500">⚠ {route.hazardsNearby.length} hazard{route.hazardsNearby.length > 1 ? 's' : ''}</span>
                                ) : (
                                  <span className="text-emerald-500">✓ Clear path</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {/* Hazard legend */}
                        {routeData.hazards.length > 0 && (
                          <div className="p-2.5 bg-red-500/5 border border-red-500/15 rounded-xl">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1.5">
                              Active Hazards Considered ({routeData.hazards.length})
                            </p>
                            <div className="space-y-0.5 max-h-20 overflow-y-auto">
                              {routeData.hazards.slice(0, 6).map((h: any) => (
                                <p key={h.id} className="text-[9px] text-slate-500 flex items-center gap-1">
                                  <span>{h.type === 'FLOOD' ? '🌊' : h.type === 'THREAT' ? '⚡' : '⚠'}</span>
                                  <span className="truncate">{h.name}</span>
                                </p>
                              ))}
                              {routeData.hazards.length > 6 && <p className="text-[9px] text-slate-600">+{routeData.hazards.length - 6} more</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {layers.evacuationRoutes && evacRoutes && (
              <div className="suraksha-card p-6 border-l-4 border-l-blue-500 bg-blue-50/30">
                 <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-blue-600" /> {t('map_page.evacuation_route')}
                </h3>
                <p className="text-xs text-blue-700 font-bold mb-4">{t('map_page.evacuation_desc')}</p>
                <button onClick={handleExportRoute} disabled={isExportingRoute} className="w-full bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-widest py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isExportingRoute ? t('map_page.exporting') : t('map_page.export_route_pdf')}
                </button>
              </div>
            )}

            {selectedZone && (
              <div className="suraksha-card p-6 flex flex-col gap-4 border-l-4 border-l-blue-500 animate-in slide-in-from-left-4 duration-300">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-slate-700/50 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">🗺️ {selectedZone.province} {t('map_page.province')}</span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{selectedZone.zoneName} {t('map_page.district')}</h3>
                  </div>
                  <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-white font-bold text-sm">✕</button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center">
                  📢 {t('map_page.dispatch_local_alert')}
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-3 h-[700px] flex flex-col bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
            <MapContainer center={SRI_LANKA_CENTER} zoom={DEFAULT_ZOOM} maxBounds={SRI_LANKA_BOUNDS} maxBoundsViscosity={0.9} minZoom={7} maxZoom={17} style={{ flex: 1, width: '100%' }} className="z-0" zoomControl={false}>
              <ZoomControl position="bottomright" />
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <MapAddressSearch onLocationFound={(loc) => {
                setSearchedPin(loc);
                if (loc.latitude && loc.longitude) {
                  setRouteFromLat(String(loc.latitude.toFixed(6)));
                  setRouteFromLng(String(loc.longitude.toFixed(6)));
                }
              }} />

              {districtGeoJSON && (
                <GeoJSON key={`${mapMode}-${selectedZone?.zoneId}-${hoveredZoneId}`} data={districtGeoJSON} style={getZoneStyle} onEachFeature={(feature, layer) => {
                    layer.on({ mouseover: () => setHoveredZoneId(feature.properties.ZONE_ID), mouseout: () => setHoveredZoneId(null), click: () => handleZoneClick(feature) });
                    layer.bindTooltip(`<div style="font-family: inherit; font-size: 11px; font-weight: 800; color: #1e293b;">📍 ${feature.properties.ZONE_NAME} District</div>`, { direction: 'top', className: 'shadow-lg border-0 bg-white dark:bg-gray-900/95 rounded-lg px-2.5 py-1 z-[2000]' });
                }} />
              )}

              {layers.weatherProjections && (
                 <Polygon positions={MOCK_CYCLONE_CONE} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1, dashArray: '5, 10' }}>
                   <Popup className="font-sans">
                     <div className="font-bold text-red-600 text-sm">⚠️ {t('map_page.cyclone_path_projection', 'Cyclone Path Projection')}</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('map_page.cone_of_uncertainty', 'DMC Cone of Uncertainty (Next 72h)')}</div>
                   </Popup>
                 </Polygon>
              )}

              {layers.evacuationRoutes && evacRoutes && (
                 <>
                   <Polyline positions={evacRoutes.primary} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }} />
                   <Polyline positions={evacRoutes.alternate} pathOptions={{ color: '#64748b', weight: 3, dashArray: '10, 10', opacity: 0.8 }} />
                 </>
              )}

              {/* ── Safe Routes Layer ─────────────────────────────────── */}
              {layers.safeRoutes && routeData && routeData.routes.map((route: any, idx: number) => {
                const isSelected = idx === selectedRouteIdx;
                const colors = ['#16a34a', '#d97706', '#9333ea'];
                const color = colors[idx] || '#6b7280';
                return (
                  <React.Fragment key={`route-${idx}`}>
                    <Polyline
                      positions={route.waypoints as [number, number][]}
                      pathOptions={{
                        color,
                        weight: isSelected ? 6 : 3,
                        opacity: isSelected ? 0.95 : 0.45,
                        dashArray: isSelected ? undefined : '8 6',
                      }}
                    >
                      <Popup className="suraksha-popup" minWidth={220}>
                        <div className="p-2 font-sans">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-black text-sm" style={{ color }}>{route.name}</span>
                            <span className={cn('text-[9px] font-black text-white px-2 py-0.5 rounded-md tracking-wider',
                              route.risk === 'LOW' ? 'bg-green-500' : route.risk === 'MODERATE' ? 'bg-amber-500' : route.risk === 'HIGH' ? 'bg-orange-500' : 'bg-red-600'
                            )}>{route.risk} RISK</span>
                          </div>
                          <p className="text-xs text-gray-500">Safety Score: <strong>{route.score}%</strong> · {route.estimatedKm} km</p>
                          {route.hazardsNearby.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Hazards Nearby:</p>
                              {route.hazardsNearby.slice(0, 3).map((h: any, i: number) => (
                                <p key={i} className="text-[11px] text-gray-500">⚠ {h.name} ({h.distanceKm} km)</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Polyline>
                    {/* Start + End markers for selected route */}
                    {isSelected && (
                      <>
                        <Marker
                          position={route.waypoints[0] as [number, number]}
                          icon={L.divIcon({ className: '', html: `<div style="background:#1e3a5f;color:#fff;font-size:10px;font-weight:900;padding:4px 8px;border-radius:8px;border:2px solid white;white-space:nowrap;">📍 START</div>`, iconAnchor: [30, 12] })}
                        />
                        <Marker
                          position={route.waypoints[route.waypoints.length - 1] as [number, number]}
                          icon={L.divIcon({ className: '', html: `<div style="background:#16a34a;color:#fff;font-size:10px;font-weight:900;padding:4px 8px;border-radius:8px;border:2px solid white;white-space:nowrap;">🛡 ${routeData.destination.name.slice(0, 18)}</div>`, iconAnchor: [30, 12] })}
                        />
                      </>
                    )}
                  </React.Fragment>
                );
              })}

              {layers.assignmentArrows && assignmentArrows.map(arrow => (
                 <Polyline key={arrow.id} positions={arrow.positions} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.8 }}>
                   <Popup><div className="text-xs font-bold text-amber-600">{t('map_page.assignment_route', 'Camp to Incident Assignment Route')}</div></Popup>
                 </Polyline>
              ))}

              {layers.volunteers && volunteers.map(vol => (
                <Marker
                  key={vol.id}
                  position={[vol.latitude, vol.longitude]}
                  icon={createVolunteerIcon(vol.user?.role === 'FIELD_RESPONDER' ? 'Rescue' : 'General')}
                >
                  <Popup className="suraksha-popup">
                    <div className="font-sans p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-black text-slate-800 text-sm">{vol.user?.name || 'Field Personnel'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        {vol.user?.role?.replace('_', ' ')}
                        {vol.user?.isFieldActive && <span className="ml-2 text-green-600">● ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 mb-2">
                        Last ping: {new Date(vol.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {vol.latitude.toFixed(5)}, {vol.longitude.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.incidents && mapMode === 'incidents' && activeIncidents.map((incident) => (
                <Marker key={incident.id} position={[incident.latitude, incident.longitude]} icon={createPinIcon(incident.severity, incident.category)}>
                  <Popup className="suraksha-popup" minWidth={220}>
                    <div className="p-2 font-sans">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("text-[9px] font-black text-white px-2 py-0.5 rounded-md tracking-wider uppercase", incident.severity === 'CRITICAL' ? 'bg-red-500' : incident.severity === 'HIGH' ? 'bg-orange-500' : incident.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500')}>{incident.severity}</span>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{incident.category}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug">{incident.title}</h4>
                      
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.reliefCamps && mapMode === 'incidents' && camps.map((camp) => (
                camp.latitude && camp.longitude && (
                  <Marker key={camp.id} position={[camp.latitude, camp.longitude]} icon={createCampIcon()}>
                    <Popup className="suraksha-popup" minWidth={220}>
                      <div className="p-2 font-sans">
                        <div className="flex items-center gap-2 mb-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('map_page.active_safety_hub')}</span></div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">{camp.name}</h4>
                        <div className="space-y-2 mt-4 mb-2">
                          <div className="flex justify-between text-[10px] font-black"><span className="text-gray-400 dark:text-gray-500">{t('map_page.occupancy')}</span><span className="text-slate-800">{camp.currentOccupancy} / {camp.totalCapacity}</span></div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(camp.currentOccupancy / camp.totalCapacity) * 100}%` }} /></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}

              {/* ── Safe Zones Layer ─────────────────────────────────────── */}
              {layers.safeZones && activeDangerZones.map((zone: any) => (
                <React.Fragment key={zone.gaugeId}>
                  {/* Red danger circle */}
                  <Circle
                    center={[zone.latitude, zone.longitude]}
                    radius={zone.dangerRadiusKm * 1000}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                  />
                  {/* Gauge pin */}
                  <Marker
                    position={[zone.latitude, zone.longitude]}
                    icon={L.divIcon({
                      className: '',
                      html: `<div style="background:#ef4444;color:#fff;font-size:10px;font-weight:900;padding:4px 8px;border-radius:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;">${zone.alertLevel}</div>`,
                      iconAnchor: [40, 12],
                    })}
                  >
                    <Popup className="suraksha-popup" minWidth={260}>
                      <div className="p-2 font-sans">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-md tracking-wider uppercase ${zone.alertLevel === 'CRITICAL' ? 'bg-red-500' : zone.alertLevel === 'WARNING' ? 'bg-orange-500' : 'bg-yellow-500'}`}>{zone.alertLevel}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flood Alert</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm">{zone.riverName} @ {zone.stationName}</h4>
                        <p className="text-[11px] text-gray-500 mb-2">{zone.district} · Danger radius: {zone.dangerRadiusKm} km</p>
                        {zone.safeZones && zone.safeZones.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">🛡 Nearest Safe Zones:</p>
                            {zone.safeZones.filter((z: any) => !z.isInDangerZone).slice(0, 3).map((sz: any) => (
                              <a key={sz.id} href={sz.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline mb-0.5">
                                <span>📍</span><span className="font-semibold">{sz.name}</span><span className="text-gray-400">({sz.distanceKm} km)</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                  {/* Green safe place markers */}
                  {zone.safeZones && zone.safeZones.filter((sz: any) => !sz.isInDangerZone).slice(0, 5).map((sz: any) => (
                    <Marker
                      key={sz.id}
                      position={[sz.latitude, sz.longitude]}
                      icon={L.divIcon({
                        className: '',
                        html: `<div style="background:#16a34a;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
                        iconSize: [12, 12], iconAnchor: [6, 6],
                      })}
                    >
                      <Popup className="suraksha-popup" minWidth={200}>
                        <div className="p-2 font-sans">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Safe Zone</span>
                          </div>
                          <h4 className="font-black text-slate-900 text-sm">{sz.name}</h4>
                          <p className="text-[11px] text-gray-500">{sz.type.replace(/_/g, ' ')} · {sz.distanceKm} km from danger</p>
                          {sz.address && <p className="text-[10px] text-gray-400 mt-1">{sz.address}</p>}
                          {sz.capacity && <p className="text-[10px] text-emerald-700 font-bold mt-1">Capacity: {sz.capacity}</p>}
                          <a href={sz.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-bold text-blue-600 hover:underline">🗺 Get Directions</a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </React.Fragment>
              ))}
            </MapContainer>

            {/* Historical Incident Replay Scrubber (LOW) */}
            <div className="bg-white dark:bg-[#131f33] border-t border-gray-200 dark:border-slate-700/50 p-4 flex items-center gap-4 z-[1000]">
              <button onClick={() => { if(timeScrubber === 100) setTimeScrubber(0); setIsPlaying(!isPlaying); }} className="w-10 h-10 shrink-0 bg-blue-50 dark:bg-blue-600/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-600/30 rounded-full flex items-center justify-center transition-colors">
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              <div className="flex-1 flex flex-col gap-1">
                 <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('map_page.historical_timeline')}</span>
                   <span>{timeScrubber}%</span>
                 </div>
                 <input type="range" min="0" max="100" value={timeScrubber} onChange={(e) => setTimeScrubber(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
              </div>
            </div>

            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2.5 bg-white dark:bg-[#1a2540] p-2 rounded-2xl border border-gray-200 dark:border-slate-600/50 shadow-2xl">
              <button onClick={() => setMapMode('incidents')} className={cn("px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all", mapMode === 'incidents' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50")}>📍 {t('map_page.incidents_layout')}</button>
              <button onClick={() => setMapMode('zones')} className={cn("px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all", mapMode === 'zones' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50")}>🗺️ {t('map_page.zone_boundaries')}</button>
            </div>

            {mapMode === 'incidents' && (
              <div className="absolute bottom-24 left-6 z-[1000] w-48 bg-white dark:bg-[#1a2540] border border-gray-200 dark:border-slate-600/50 shadow-2xl rounded-2xl p-4 transition-all">
                <h4 className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-3 pl-0.5 border-b border-gray-200 dark:border-slate-600/50 pb-2">{t('map_page.legend')}</h4>
                <div className="space-y-2">
                  {[{ label: t('map_page.critical_response'), color: '#ef4444' }, { label: t('map_page.high_alert'), color: '#f97316' }, { label: t('map_page.relief_hub'), color: '#10b981', isCamp: true }, { label: t('map_page.volunteer'), color: '#3b82f6', isVol: true }, { label: 'Safe Zone', color: '#16a34a' }, { label: 'Danger Zone', color: '#ef4444', isDanger: true }, ...(layers.safeRoutes && routeData ? [{ label: 'Primary Route', color: '#16a34a', isRoute: true }, { label: 'Alt Route', color: '#d97706', isRoute: true }] : [])].map((item: any, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={cn("w-2.5 h-2.5 shadow-sm", item.isCamp ? "rounded-sm rotate-45" : item.isVol ? "rounded-full border border-white" : item.isDanger ? "rounded-full opacity-40 border-2 border-red-500" : item.isRoute ? "h-0.5 w-5 rounded" : "rounded-full")} style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-24 right-6 z-[1000] w-52 bg-white dark:bg-[#1a2540] border border-gray-200 dark:border-slate-600/50 shadow-2xl rounded-2xl p-4 transition-all">
              <h4 className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-3 pl-0.5 border-b border-gray-200 dark:border-slate-600/50 pb-2">{t('map_page.layers')}</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(layers).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input type="checkbox" checked={enabled} onChange={() => setLayers(prev => ({ ...prev, [key]: !enabled }))} className="w-3.5 h-3.5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" />
                    <span className={cn("text-[10px] font-bold transition-all uppercase tracking-wider", enabled ? "text-slate-700 dark:text-slate-200" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300")}>{t(`map_page.layer_${key}`, key.replace(/([A-Z])/g, ' $1').trim())}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      );
}
