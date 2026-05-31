import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Zap, 
  Search, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Heart,
  Home
} from 'lucide-react';

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
    CRITICAL: '#ef4444', // Red
    HIGH: '#f97316',     // Orange
    MEDIUM: '#eab308',   // Yellow
    LOW: '#22c55e'       // Green
  };
  const color = colors[severity] || '#6366f1';

  // Dynamic symbol/indicator inside pin based on category
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
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border: 2.5px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 13px;
          margin-top: -1px;
          margin-left: -1px;
        ">${symbol}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// custom icon for safety hubs/camps
const createCampIcon = () => {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: #10b981;
        width: 34px; height: 34px;
        border-radius: 10px;
        border: 2.5px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(45deg);
      ">
        <div style="
          transform: rotate(-45deg);
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">🏕️</div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

// Autocomplete location search sub-component
function MapAddressSearch({ onLocationFound }: { onLocationFound: (loc: any) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + ', Sri Lanka')}&countrycodes=lk&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'Suraksha-DashboardMap/1.0' } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 450);
  };

  const handleGeocodeSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/location/geocode',
        { address: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.latitude) {
        map.flyTo([response.data.latitude, response.data.longitude], 13, { duration: 1.6 });
        onLocationFound(response.data);
      } else {
        setError('Location not resolved in Sri Lanka.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Geocoding search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-6 left-6 z-[1000] w-full max-w-sm font-sans">
      <div className="flex bg-white/95 backdrop-blur-md rounded-[1.25rem] shadow-2xl border border-slate-100 p-2 gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/25">
        <div className="flex items-center pl-2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          value={query}
          onChange={handleInput}
          placeholder="Search town, road, city or zone..."
          className="flex-1 bg-transparent px-1 py-1.5 text-xs text-slate-800 focus:outline-none font-bold"
          onKeyDown={(e) => e.key === 'Enter' && handleGeocodeSearch()}
        />
        <button
          onClick={handleGeocodeSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 mt-2 overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              onClick={() => {
                const lat = parseFloat(s.lat);
                const lon = parseFloat(s.lon);
                setQuery(s.display_name.split(',')[0]);
                setSuggestions([]);
                map.flyTo([lat, lon], 14, { duration: 1.3 });
                onLocationFound({ latitude: lat, longitude: lon, displayName: s.display_name });
              }}
              className="px-4 py-3 text-[11px] font-bold text-slate-600 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <span className="text-slate-400">📍</span>
              <span className="truncate">{s.display_name}</span>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-3 mt-2 text-[10px] font-bold border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [districtGeoJSON, setDistrictGeoJSON] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [searchedPin, setSearchedPin] = useState<any | null>(null);
  const [mapMode, setMapMode] = useState<'incidents' | 'zones'>('incidents');
  const [layers, setLayers] = useState({
    incidents: true,
    riskZones: true,
    reliefCamps: true
  });

  useEffect(() => {
    // 1. Fetch initial incident reports and camp locations
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [incRes, campRes] = await Promise.all([
          axios.get('http://localhost:3001/api/incidents', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3001/api/camps', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setIncidents(incRes.data);
        setCamps(campRes.data);
      } catch (err) {
        console.error('Failed to load static datasets for map:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // 2. Load district GeoJSON boundaries and calculate normalized risk weightings
    if (incidents.length === 0) return;

    fetch('/srilanka_districts.geojson')
      .then((res) => res.json())
      .then((data) => {
        const densityCounts: Record<string, number> = {};
        incidents.forEach((inc) => {
          if (inc.zoneId) {
            densityCounts[inc.zoneId] = (densityCounts[inc.zoneId] || 0) + 1;
          }
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
    // 3. Connect Socket.io client to receive real-time incident pins
    const socket = io('http://localhost:3001');

    socket.on('new-incident', (newIncident: Incident) => {
      setIncidents((prev) => {
        if (prev.some((item) => item.id === newIncident.id)) return prev;
        return [newIncident, ...prev];
      });
    });

    socket.on('incident-updated', (updatedIncident: Incident) => {
      setIncidents((prev) =>
        prev.map((item) => (item.id === updatedIncident.id ? updatedIncident : item))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getZoneStyle = (feature: any) => {
    const isSelected = feature.properties.ZONE_ID === selectedZone?.zoneId;
    const isHovered = feature.properties.ZONE_ID === hoveredZoneId;
    const risk = feature.properties.RISK_SCORE || 0;

    // Vibrant harmonious HSL/Hex color scale representing risk
    let fillColor = '#10b981'; // Emerald (Safe)
    if (risk > 0.65) fillColor = '#ef4444'; // Red (High Risk)
    else if (risk > 0.35) fillColor = '#f97316'; // Orange (Elevated Risk)
    else if (risk > 0.08) fillColor = '#f59e0b'; // Amber (Moderate Risk)

    return {
      fillColor,
      fillOpacity: isSelected ? 0.45 : isHovered ? 0.3 : 0.1,
      color: isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#cbd5e1',
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      dashArray: isSelected ? undefined : '3 4'
    };
  };

  const handleZoneClick = (feature: any) => {
    const props = feature.properties;
    const zoneIncidents = incidents.filter((i) => i.zoneId === props.ZONE_ID);

    setSelectedZone({
      zoneId: props.ZONE_ID,
      zoneName: props.ZONE_NAME,
      province: props.PROVINCE,
      riskScore: props.RISK_SCORE || 0,
      incidentCount: zoneIncidents.length,
      criticalCount: zoneIncidents.filter((i) => i.severity === 'CRITICAL').length,
      highCount: zoneIncidents.filter((i) => i.severity === 'HIGH').length
    });
  };

  const activeIncidents = incidents.filter((i) => i.latitude && i.longitude);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans h-full pb-16">
      {/* GIS Map Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Sri Lanka GIS Coordinate Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Administrative Boundaries & Real-time Threat Tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              Live Monitoring System Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Content Block */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Stats & Info Panel */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="suraksha-card p-6 flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>National Operations Summary</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-800">{incidents.length}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Incidents</span>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-red-600">
                  {incidents.filter((i) => ['CRITICAL', 'HIGH'].includes(i.severity)).length}
                </span>
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1">Critical/High</span>
              </div>
            </div>

            <div className="space-y-3.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Active Support Camps</span>
                <span className="text-slate-800 font-extrabold">{camps.length}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[80%]" />
              </div>
              
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500 font-semibold">Risk Coverage Index</span>
                <span className="text-blue-600 font-extrabold">94.2%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[94.2%]" />
              </div>
            </div>
          </div>

          {/* Selected Zone Side Panel */}
          {selectedZone ? (
            <div className="suraksha-card p-6 flex flex-col gap-4 border-l-4 border-l-blue-600 animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    🗺️ {selectedZone.province} Province
                  </span>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {selectedZone.zoneName} District
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedZone(null)}
                  className="text-slate-300 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col">
                  <span className="text-sm font-black text-slate-800">{selectedZone.incidentCount}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Active Cases</span>
                </div>
                <div className="bg-red-50 rounded-xl p-3 flex flex-col">
                  <span className="text-sm font-black text-red-600">{selectedZone.criticalCount}</span>
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-0.5">Critical Cases</span>
                </div>
                <div className="bg-violet-50 rounded-xl p-3 flex flex-col">
                  <span className="text-sm font-black text-violet-600">
                    {Math.round(selectedZone.riskScore * 100)}%
                  </span>
                  <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest mt-0.5">Threat Index</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 flex flex-col">
                  <span className="text-sm font-black text-emerald-600">
                    {camps.filter((c) => incidents.some(i => i.zoneId === selectedZone.zoneId)).length}
                  </span>
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">Relief Hubs</span>
                </div>
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center">
                📢 Dispatch Local Alert
              </button>
            </div>
          ) : (
            <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center py-10 bg-slate-50/50 border-2 border-dashed border-slate-200">
              <span className="text-slate-400 text-3xl mb-2">🗺️</span>
              <p className="text-xs font-bold text-slate-400 leading-normal">
                Click on any administrative district polygon on the map to display localized threat metrics.
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Mapping Hub Area */}
        <div className="xl:col-span-3 h-[600px] bg-slate-100 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
          
          <MapContainer
            center={SRI_LANKA_CENTER}
            zoom={DEFAULT_ZOOM}
            maxBounds={SRI_LANKA_BOUNDS}
            maxBoundsViscosity={0.9}
            minZoom={7}
            maxZoom={17}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapAddressSearch onLocationFound={(loc) => setSearchedPin(loc)} />

            {/* District Boundary GeoJSON Layers */}
            {districtGeoJSON && (
              <GeoJSON
                key={`${mapMode}-${selectedZone?.zoneId}-${hoveredZoneId}`}
                data={districtGeoJSON}
                style={getZoneStyle}
                onEachFeature={(feature, layer) => {
                  layer.on({
                    mouseover: () => setHoveredZoneId(feature.properties.ZONE_ID),
                    mouseout: () => setHoveredZoneId(null),
                    click: () => handleZoneClick(feature)
                  });
                  layer.bindTooltip(
                    `<div style="font-family: inherit; font-size: 11px; font-weight: 800; color: #1e293b;">
                       📍 ${feature.properties.ZONE_NAME} District
                     </div>`,
                    { direction: 'top', className: 'shadow-lg border-0 bg-white/95 rounded-lg px-2.5 py-1 z-[2000]' }
                  );
                }}
              />
            )}

            {/* Pins Render Block (when layers are enabled) */}
            {layers.incidents && mapMode === 'incidents' && activeIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.latitude, incident.longitude]}
                icon={createPinIcon(incident.severity, incident.category)}
              >
                <Popup className="suraksha-popup" minWidth={220}>
                  <div className="p-2 font-sans">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn(
                        "text-[9px] font-black text-white px-2 py-0.5 rounded-md tracking-wider uppercase",
                        incident.severity === 'CRITICAL' ? 'bg-red-500' : 
                        incident.severity === 'HIGH' ? 'bg-orange-500' : 
                        incident.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      )}>
                        {incident.severity}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {incident.category}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-snug">{incident.title}</h4>
                    <p className="text-slate-500 text-xs mt-1">📍 {incident.location}</p>

                    {incident.zoneName && (
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Boundary:</span>
                        <span className="text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                          {incident.zoneName} District
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Relief Camps Hubs Pins */}
            {layers.reliefCamps && mapMode === 'incidents' && camps.map((camp) => (
              camp.latitude && camp.longitude && (
                <Marker
                  key={camp.id}
                  position={[camp.latitude, camp.longitude]}
                  icon={createCampIcon()}
                >
                  <Popup className="suraksha-popup" minWidth={220}>
                    <div className="p-2 font-sans">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          Active Safety Hub
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-sm leading-snug">{camp.name}</h4>
                      <p className="text-slate-500 text-xs mt-1">📍 {camp.location}</p>

                      <div className="space-y-2 mt-4 mb-2">
                        <div className="flex justify-between text-[10px] font-black">
                          <span className="text-slate-400">Current Occupancy</span>
                          <span className="text-slate-800">{camp.currentOccupancy} / {camp.totalCapacity}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(camp.currentOccupancy / camp.totalCapacity) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Searched coordinate pin indicator */}
            {searchedPin && (
              <Marker
                position={[searchedPin.latitude, searchedPin.longitude]}
                icon={L.divIcon({
                  html: `<div class="w-9 h-9 rounded-full bg-violet-600 border-3 border-white flex items-center justify-center shadow-2xl text-white font-extrabold text-sm animate-bounce">📍</div>`,
                  className: '',
                  iconAnchor: [18, 18],
                  popupAnchor: [0, -18]
                })}
              >
                <Popup>
                  <div className="text-slate-800 font-sans p-1 text-xs">
                    <strong className="text-violet-600 text-xs uppercase tracking-widest font-black block">Searched GPS Coordinates</strong>
                    <p className="text-slate-500 font-bold mt-1 leading-normal">{searchedPin.displayName}</p>
                    {searchedPin.zone && (
                      <div className="mt-2.5 bg-violet-50 text-violet-600 border border-violet-100 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded inline-block">
                        🗺️ {searchedPin.zone.zoneName} District
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Risk range target boundaries */}
            {layers.riskZones && mapMode === 'incidents' && incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).map((incident, idx) => (
              incident.latitude && incident.longitude && (
                <Circle 
                  key={`risk-circle-${idx}`}
                  center={[incident.latitude, incident.longitude]}
                  pathOptions={{ 
                    color: incident.severity === 'CRITICAL' ? '#EF4444' : '#F97316', 
                    fillColor: incident.severity === 'CRITICAL' ? '#EF4444' : '#F97316', 
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '4, 8'
                  }}
                  radius={incident.severity === 'CRITICAL' ? 2200 : 1200}
                />
              )
            ))}
          </MapContainer>

          {/* Floating Toggle Controls */}
          <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2.5 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-100 shadow-2xl">
            <button
              onClick={() => setMapMode('incidents')}
              className={cn(
                "px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                mapMode === 'incidents' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              📍 Incidents Layout
            </button>
            <button
              onClick={() => setMapMode('zones')}
              className={cn(
                "px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                mapMode === 'zones' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              🗺️ Zone Boundaries
            </button>
          </div>

          {/* Floating Map Legend Panel */}
          {mapMode === 'incidents' && (
            <div className="absolute bottom-6 left-6 z-[1000] w-48 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 transition-all hover:-translate-y-1">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-0.5 border-b border-slate-50 pb-2">Legend</h4>
              <div className="space-y-2">
                {[
                  { label: 'Critical Response', color: '#ef4444' },
                  { label: 'High Alert', color: '#f97316' },
                  { label: 'Moderate Risk', color: '#eab308' },
                  { label: 'General / Low', color: '#22c55e' },
                  { label: 'Relief Hub (Camp)', color: '#10b981', isCamp: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div 
                      className={cn(
                        "w-2.5 h-2.5 shadow-sm",
                        item.isCamp ? "rounded-sm rotate-45" : "rounded-full"
                      )}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Layers Toggle Overlay */}
          <div className="absolute bottom-6 right-6 z-[1000] w-48 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 transition-all">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-0.5 border-b border-slate-50 pb-2">Layers</h4>
            <div className="space-y-2">
              {Object.entries(layers).map(([key, enabled]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setLayers(prev => ({ ...prev, [key]: !enabled }))}
                    className="w-3.5 h-3.5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <span className={cn(
                    "text-[10px] font-bold transition-all uppercase tracking-wider",
                    enabled ? "text-slate-700" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
