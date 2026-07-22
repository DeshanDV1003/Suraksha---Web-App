import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap, Circle, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  Layers, Zap, Search, Shield, AlertTriangle, TrendingUp, Activity,
  Heart, Home, Play, Pause, Navigation, Clock, User
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
      <div className="flex bg-white dark:bg-gray-900/95 backdrop-blur-md rounded-[1.25rem] shadow-2xl border border-gray-200 dark:border-gray-800 p-2 gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/25">
        <div className="flex items-center pl-2 text-gray-400 dark:text-gray-500"><Search className="w-4 h-4" /></div>
        <input value={query} onChange={handleInput} placeholder="Search town, road, city or zone..." className="flex-1 bg-transparent px-1 py-1.5 text-xs text-slate-800 focus:outline-none font-bold" onKeyDown={(e) => e.key === 'Enter' && handleGeocodeSearch()} />
        <button onClick={handleGeocodeSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl px-4 py-2 transition-colors disabled:opacity-50">{loading ? '...' : 'Go'}</button>
      </div>
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 mt-2 overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div key={idx} onClick={() => { const lat = parseFloat(s.lat); const lon = parseFloat(s.lon); setQuery(s.display_name.split(',')[0]); setSuggestions([]); map.flyTo([lat, lon], 14, { duration: 1.3 }); onLocationFound({ latitude: lat, longitude: lon, displayName: s.display_name }); }} className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 border-b border-slate-50 cursor-pointer hover:bg-gray-50 dark:bg-gray-800/50 transition-all flex items-center gap-2">
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
      alert('Failed to export route. Please try again.');
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
    volunteers: true,
    weatherProjections: false,
    evacuationRoutes: false,
    assignmentArrows: false,
  });

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
        setVolunteers(generateMockVolunteers(incs));
        setEvacRoutes(generateEvacRoutes());
        setAssignmentArrows(generateAssignmentArrows(campRes.data, incs));
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
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Monitoring System Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="suraksha-card p-6 flex flex-col gap-4">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Activity className="w-4 h-4 text-blue-500" /><span>National Operations Summary</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-800">{activeIncidents.length}</span>
                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Total Incidents</span>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-red-600">{activeIncidents.filter((i) => ['CRITICAL', 'HIGH'].includes(i.severity)).length}</span>
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1">Critical/High</span>
                </div>
              </div>

              <div className="space-y-3.5 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Active Support Camps</span>
                  <span className="text-slate-800 font-extrabold">{camps.length}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[80%]" />
                </div>
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">Risk Coverage Index</span>
                  <span className="text-blue-600 font-extrabold">94.2%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[94.2%]" />
                </div>
              </div>
            </div>

            {layers.evacuationRoutes && evacRoutes && (
              <div className="suraksha-card p-6 border-l-4 border-l-blue-500 bg-blue-50/30">
                 <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-blue-600" /> Active Evacuation Route
                </h3>
                <p className="text-xs text-blue-700 font-bold mb-4">Primary route active. ETA to safe zone: 45 mins. Alternate routes available.</p>
                <button onClick={handleExportRoute} disabled={isExportingRoute} className="w-full bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-widest py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isExportingRoute ? 'Exporting...' : 'Export Route PDF'}
                </button>
              </div>
            )}

            {selectedZone && (
              <div className="suraksha-card p-6 flex flex-col gap-4 border-l-4 border-l-slate-800 animate-in slide-in-from-left-4 duration-300">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">🗺️ {selectedZone.province} Province</span>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{selectedZone.zoneName} District</h3>
                  </div>
                  <button onClick={() => setSelectedZone(null)} className="text-slate-300 hover:text-gray-600 dark:text-gray-300 font-bold text-sm">✕</button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center">
                  📢 Dispatch Local Alert
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-3 h-[700px] flex flex-col bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
            <MapContainer center={SRI_LANKA_CENTER} zoom={DEFAULT_ZOOM} maxBounds={SRI_LANKA_BOUNDS} maxBoundsViscosity={0.9} minZoom={7} maxZoom={17} style={{ flex: 1, width: '100%' }} className="z-0" zoomControl={false}>
              <ZoomControl position="bottomright" />
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <MapAddressSearch onLocationFound={(loc) => setSearchedPin(loc)} />

              {districtGeoJSON && (
                <GeoJSON key={`${mapMode}-${selectedZone?.zoneId}-${hoveredZoneId}`} data={districtGeoJSON} style={getZoneStyle} onEachFeature={(feature, layer) => {
                    layer.on({ mouseover: () => setHoveredZoneId(feature.properties.ZONE_ID), mouseout: () => setHoveredZoneId(null), click: () => handleZoneClick(feature) });
                    layer.bindTooltip(`<div style="font-family: inherit; font-size: 11px; font-weight: 800; color: #1e293b;">📍 ${feature.properties.ZONE_NAME} District</div>`, { direction: 'top', className: 'shadow-lg border-0 bg-white dark:bg-gray-900/95 rounded-lg px-2.5 py-1 z-[2000]' });
                }} />
              )}

              {layers.weatherProjections && (
                 <Polygon positions={MOCK_CYCLONE_CONE} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1, dashArray: '5, 10' }}>
                   <Popup className="font-sans">
                     <div className="font-bold text-red-600 text-sm">⚠️ Cyclone Path Projection</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">DMC Cone of Uncertainty (Next 72h)</div>
                   </Popup>
                 </Polygon>
              )}

              {layers.evacuationRoutes && evacRoutes && (
                 <>
                   <Polyline positions={evacRoutes.primary} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }} />
                   <Polyline positions={evacRoutes.alternate} pathOptions={{ color: '#64748b', weight: 3, dashArray: '10, 10', opacity: 0.8 }} />
                 </>
              )}

              {layers.assignmentArrows && assignmentArrows.map(arrow => (
                 <Polyline key={arrow.id} positions={arrow.positions} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.8 }}>
                   <Popup><div className="text-xs font-bold text-amber-600">Camp to Incident Assignment Route</div></Popup>
                 </Polyline>
              ))}

              {layers.volunteers && volunteers.map(vol => (
                <Marker key={vol.id} position={[vol.latitude, vol.longitude]} icon={createVolunteerIcon(vol.skill)}>
                  <Popup className="suraksha-popup">
                    <div className="font-sans p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-black text-slate-800 text-sm">{vol.name}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Skill: <span className="text-blue-600">{vol.skill}</span></div>
                      <button className="w-full py-1.5 bg-blue-600 text-white rounded text-xs font-bold uppercase hover:bg-blue-700 transition">Assign to nearest</button>
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
                        <div className="flex items-center gap-2 mb-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Safety Hub</span></div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">{camp.name}</h4>
                        <div className="space-y-2 mt-4 mb-2">
                          <div className="flex justify-between text-[10px] font-black"><span className="text-gray-400 dark:text-gray-500">Occupancy</span><span className="text-slate-800">{camp.currentOccupancy} / {camp.totalCapacity}</span></div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(camp.currentOccupancy / camp.totalCapacity) * 100}%` }} /></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>

            {/* Historical Incident Replay Scrubber (LOW) */}
            <div className="bg-white dark:bg-gray-900/95 backdrop-blur-md p-4 flex items-center gap-4 z-[1000] border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => { if(timeScrubber === 100) setTimeScrubber(0); setIsPlaying(!isPlaying); }} className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full flex items-center justify-center transition-colors">
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              <div className="flex-1 flex flex-col gap-1">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Historical Timeline</span>
                   <span>{timeScrubber}%</span>
                 </div>
                 <input type="range" min="0" max="100" value={timeScrubber} onChange={(e) => setTimeScrubber(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
              </div>
            </div>

            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2.5 bg-white dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl">
              <button onClick={() => setMapMode('incidents')} className={cn("px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all", mapMode === 'incidents' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 hover:bg-gray-50 dark:bg-gray-800/50")}>📍 Incidents Layout</button>
              <button onClick={() => setMapMode('zones')} className={cn("px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all", mapMode === 'zones' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 hover:bg-gray-50 dark:bg-gray-800/50")}>🗺️ Zone Boundaries</button>
            </div>

            {mapMode === 'incidents' && (
              <div className="absolute bottom-24 left-6 z-[1000] w-48 bg-white dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-4 transition-all">
                <h4 className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-0.5 border-b border-slate-50 pb-2">Legend</h4>
                <div className="space-y-2">
                  {[{ label: 'Critical Response', color: '#ef4444' }, { label: 'High Alert', color: '#f97316' }, { label: 'Relief Hub (Camp)', color: '#10b981', isCamp: true }, { label: 'Volunteer', color: '#3b82f6', isVol: true }].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={cn("w-2.5 h-2.5 shadow-sm", item.isCamp ? "rounded-sm rotate-45" : item.isVol ? "rounded-full border border-white" : "rounded-full")} style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-24 right-6 z-[1000] w-48 bg-white dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-4 transition-all">
              <h4 className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-0.5 border-b border-slate-50 pb-2">Layers</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(layers).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input type="checkbox" checked={enabled} onChange={() => setLayers(prev => ({ ...prev, [key]: !enabled }))} className="w-3.5 h-3.5 text-blue-600 bg-gray-100 dark:bg-gray-800 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" />
                    <span className={cn("text-[10px] font-bold transition-all uppercase tracking-wider", enabled ? "text-slate-700" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:text-gray-300")}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
