import { useEffect, useState } from 'react'
import { useDialog } from '@/components/ui/dialogs/DialogProvider'
import {
  Building2, Users, PieChart, AlertTriangle,
  Utensils, Droplets, Heart, Zap, Bath,
  UserCheck, Baby, Accessibility, Clock, MapPin, Plus, X, Loader2, ListTodo, Stethoscope, ArrowRightLeft, ShieldAlert, Navigation,
  Anchor, Bus, Truck, Wind, Ambulance, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Waves, Phone, Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { campService, rescueService, supplyRequestService } from '../services/api'
import { hospitalApi } from '@/services/hospitalApi'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

const VEHICLE_ICONS: Record<string, any> = {
  BOAT: Anchor, BUS: Bus, VAN: Bus, TRUCK: Truck,
  HELICOPTER: Wind, AMBULANCE: Ambulance,
}
const VEHICLE_COLORS: Record<string, string> = {
  BOAT: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  BUS: 'text-green-400 bg-green-500/10 border-green-500/30',
  VAN: 'text-green-400 bg-green-500/10 border-green-500/30',
  TRUCK: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  HELICOPTER: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  AMBULANCE: 'text-red-400 bg-red-500/10 border-red-500/30',
}
const MISSION_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-green-500/15 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const servicesList = [
  { name: 'food', icon: Utensils },
  { name: 'water', icon: Droplets },
  { name: 'medical', icon: Heart },
  { name: 'charging', icon: Zap },
  { name: 'toilets', icon: Bath },
  { name: 'women', icon: UserCheck },
  { name: 'child-care', icon: Baby },
  { name: 'disability', icon: Accessibility },
]

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

const createPickerIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#06b6d4;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.4)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function RescueDetailModal({
  mission, userLocation, onClose
}: {
  mission: any; userLocation: { lat: number; lng: number } | null; onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  const vehicle = mission.vehicle
  const VIcon = VEHICLE_ICONS[vehicle?.type] || Bus
  const vcol = VEHICLE_COLORS[vehicle?.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
  const hasCoords = vehicle?.latitude && vehicle?.longitude
  const distKm = (userLocation && hasCoords)
    ? haversineKm(userLocation.lat, userLocation.lng, vehicle.latitude, vehicle.longitude)
    : null

  // Fetch OSRM walking route
  useEffect(() => {
    if (!userLocation || !hasCoords) return
    setRouteLoading(true)
    const url = `https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${vehicle.longitude},${vehicle.latitude}?geometries=geojson&overview=full`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const route = data.routes?.[0]
        if (route) {
          const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng])
          setRouteCoords(coords)
          setRouteInfo({
            distanceKm: +(route.distance / 1000).toFixed(2),
            durationMin: Math.round(route.duration / 60),
          })
        }
      })
      .catch(() => {})
      .finally(() => setRouteLoading(false))
  }, [])

  const isFull = mission.evacuatedCount >= vehicle?.capacity
  const spotsLeft = Math.max(0, (vehicle?.capacity || 0) - (mission.evacuatedCount || 0))

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131f33] border border-blue-500/20 w-full max-w-2xl rounded-[1.5rem] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-blue-500/20 flex items-center justify-between sticky top-0 bg-white dark:bg-[#131f33] z-10">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl border', vcol)}>
              <VIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white/90 text-base">{vehicle?.name}</h3>
              <p className="text-xs text-gray-400 font-bold">{vehicle?.type} · {mission.area}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
              <span className={cn('text-xs font-black px-2.5 py-1 rounded-full border uppercase', MISSION_STATUS_COLOR[mission.status])}>
                {mission.status.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Capacity</p>
              <p className={cn('text-lg font-black', isFull ? 'text-red-400' : 'text-green-400')}>
                {isFull ? 'FULL' : `${spotsLeft} left`}
              </p>
              <p className="text-[10px] text-gray-500">{vehicle?.capacity} total</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Distance</p>
              {routeInfo ? (
                <>
                  <p className="text-lg font-black text-cyan-400">{routeInfo.distanceKm} km</p>
                  <p className="text-[10px] text-gray-500">~{routeInfo.durationMin} min walk</p>
                </>
              ) : distKm !== null ? (
                <p className="text-lg font-black text-cyan-400">{distKm.toFixed(1)} km</p>
              ) : (
                <p className="text-lg font-black text-gray-500">—</p>
              )}
            </div>
          </div>

          {/* Map with route */}
          {hasCoords ? (
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 300 }}>
              {routeLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]/80 rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              )}
              <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [vehicle.latitude, vehicle.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                />
                {/* User location marker */}
                {userLocation && (
                  <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={L.divIcon({
                      className: '',
                      html: `<div style="width:16px;height:16px;background:#06b6d4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(6,182,212,0.3)"></div>`,
                      iconSize: [16, 16], iconAnchor: [8, 8],
                    })}
                  >
                    <Popup><span style={{fontWeight:'bold',color:'#06b6d4'}}>📍 Your Location</span></Popup>
                  </Marker>
                )}
                {/* Vehicle pickup marker */}
                <Marker
                  position={[vehicle.latitude, vehicle.longitude]}
                  icon={L.divIcon({
                    className: '',
                    html: `<div style="background:#3b82f6;width:36px;height:36px;border-radius:10px;border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(45deg)"><span style="transform:rotate(-45deg);font-size:16px">⛵</span></div>`,
                    iconSize: [36, 36], iconAnchor: [18, 18],
                  })}
                >
                  <Popup>
                    <span style={{fontWeight:'bold'}}>🚨 {vehicle.name}</span><br/>
                    <span style={{fontSize:'12px'}}>{mission.area}</span>
                  </Popup>
                </Marker>
                {/* Route polyline */}
                {routeCoords.length > 0 && (
                  <RoutePolyline coords={routeCoords} />
                )}
              </MapContainer>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
              <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-bold">No GPS coordinates set for this vehicle.</p>
              <p className="text-xs text-gray-600 mt-1">Admin needs to set the pickup location.</p>
            </div>
          )}

          {/* Route steps info */}
          {routeInfo && (
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-blue-500/20 p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white/90">Safe Route to Pickup Point</p>
                <p className="text-xs text-gray-400 font-bold">
                  {routeInfo.distanceKm} km · Approx. {routeInfo.durationMin} minutes on foot
                  · Follow the blue route on the map
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${vehicle.latitude},${vehicle.longitude}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-black hover:bg-blue-500/25 transition-all flex-shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                Google Maps
              </a>
            </div>
          )}

          {/* Full warning */}
          {isFull && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-red-400">This vehicle is at full capacity</p>
                <p className="text-xs text-red-400/70 mt-0.5">Please check other available rescue transport options below.</p>
              </div>
            </div>
          )}

          {/* Contact */}
          {vehicle?.contactPhone && (
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Rescue Unit</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white/90 tracking-wider">{vehicle.contactPhone}</p>
              {vehicle.operatorName && <p className="text-xs text-gray-500">{vehicle.operatorName}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(vehicle.contactPhone); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-gray-300 hover:bg-white/10 transition-all"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Number'}
                </button>
                <a
                  href={`tel:${vehicle.contactPhone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-xs font-black text-green-400 hover:bg-green-500/25 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Now
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Separate component so Leaflet hooks work inside MapContainer
function RoutePolyline({ coords }: { coords: [number, number][] }) {
  const map = useMapEvents({})
  useEffect(() => {
    if (!map || coords.length < 2) return
    const poly = L.polyline(coords, { color: '#3b82f6', weight: 4, opacity: 0.85, dashArray: '8 4' }).addTo(map)
    map.fitBounds(poly.getBounds(), { padding: [40, 40] })
    return () => { map.removeLayer(poly) }
  }, [coords])
  return null
}

function CampRouteModal({ camp, userLocation, missions, myCheckIn, onMarkSafe, markingSafe, onClose }: {
  camp: any
  userLocation: { lat: number; lng: number }
  missions: any[]
  myCheckIn: any
  onMarkSafe: () => void
  markingSafe: boolean
  onClose: () => void
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [routeLoading, setRouteLoading] = useState(true)
  const [selectedRescue, setSelectedRescue] = useState<any>(null)

  useEffect(() => {
    if (!camp.latitude || !camp.longitude) { setRouteLoading(false); return }
    const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${camp.longitude},${camp.latitude}?geometries=geojson&overview=full`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const route = data.routes?.[0]
        if (route) {
          setRouteCoords(route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]))
          setRouteInfo({ distanceKm: +(route.distance / 1000).toFixed(1), durationMin: Math.round(route.duration / 60) })
        }
      })
      .catch(() => {})
      .finally(() => setRouteLoading(false))
  }, [])

  const available = camp.totalCapacity - camp.currentOccupancy

  // Active rescue missions — prefer ones going to this camp, then any active
  const rescueMissions = missions
    .filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
    .map(m => {
      const dist = (m.vehicle?.latitude && m.vehicle?.longitude)
        ? haversineKm(userLocation.lat, userLocation.lng, m.vehicle.latitude, m.vehicle.longitude)
        : null
      const isFull = (m.evacuatedCount || 0) >= (m.vehicle?.capacity || Infinity)
      const isForThisCamp = m.destinationCampId === camp.id
      return { ...m, _dist: dist, _isFull: isFull, _isForThisCamp: isForThisCamp }
    })
    .sort((a, b) => {
      if (a._isForThisCamp !== b._isForThisCamp) return a._isForThisCamp ? -1 : 1
      if (a._isFull !== b._isFull) return a._isFull ? 1 : -1
      if (a._dist !== null && b._dist !== null) return a._dist - b._dist
      return 0
    })

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131f33] border border-cyan-400/20 w-full max-w-2xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-5 border-b border-cyan-400/20 flex items-center justify-between bg-slate-50 dark:bg-[#0f172a] sticky top-0 z-10">
          <div>
            <h3 className="font-black text-slate-800 dark:text-white/90 text-base">{camp.name}</h3>
            <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{camp.location}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Distance</p>
              <p className="text-lg font-black text-cyan-400">
                {routeInfo ? `${routeInfo.distanceKm} km` : `${haversineKm(userLocation.lat, userLocation.lng, camp.latitude, camp.longitude).toFixed(1)} km`}
              </p>
              {routeInfo && <p className="text-[10px] text-gray-500">~{routeInfo.durationMin} min drive</p>}
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Capacity</p>
              <p className={`text-lg font-black ${available <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {available <= 0 ? 'FULL' : `${available} spots`}
              </p>
              <p className="text-[10px] text-gray-500">{camp.totalCapacity} total</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Wait Time</p>
              <p className="text-lg font-black text-white/80">{camp.waitTime || 'N/A'}</p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height: 280 }}>
            {routeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0f172a]/90 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs text-gray-400 font-bold">Calculating route…</span>
              </div>
            )}
            {camp.latitude && camp.longitude ? (
              <MapContainer
                center={[(userLocation.lat + camp.latitude) / 2, (userLocation.lng + camp.longitude) / 2]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({
                  className: '',
                  html: `<div style="width:16px;height:16px;background:#06b6d4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(6,182,212,0.3)"></div>`,
                  iconSize: [16, 16], iconAnchor: [8, 8],
                })}>
                  <Popup><strong style={{color:'#06b6d4'}}>📍 Your Location</strong></Popup>
                </Marker>
                <Marker position={[camp.latitude, camp.longitude]} icon={createCampIcon()}>
                  <Popup><strong>{camp.name}</strong><br/><span style={{fontSize:'11px'}}>{camp.location}</span></Popup>
                </Marker>
                {/* Rescue vehicle markers */}
                {rescueMissions.filter(m => m.vehicle?.latitude && m.vehicle?.longitude).map((m: any) => {
                  const VIcon = VEHICLE_ICONS[m.vehicle?.type] || Bus
                  return (
                    <Marker key={m.id} position={[m.vehicle.latitude, m.vehicle.longitude]} icon={L.divIcon({
                      className: '',
                      html: `<div style="background:#3b82f6;width:32px;height:32px;border-radius:8px;border:2px solid white;box-shadow:0 4px 10px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:14px">${m.vehicle.type === 'BOAT' ? '⛵' : m.vehicle.type === 'HELICOPTER' ? '🚁' : m.vehicle.type === 'AMBULANCE' ? '🚑' : '🚌'}</div>`,
                      iconSize: [32, 32], iconAnchor: [16, 16],
                    })}>
                      <Popup>
                        <strong>{m.vehicle.name}</strong><br/>
                        <span style={{fontSize:'11px'}}>{m.area} · {Math.max(0, m.vehicle.capacity - m.evacuatedCount)} spots left</span>
                      </Popup>
                    </Marker>
                  )
                })}
                {routeCoords.length > 0 && <RoutePolyline coords={routeCoords} />}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-[#0f172a]">
                <p className="text-sm text-gray-500">No GPS coordinates for this camp.</p>
              </div>
            )}
          </div>

          {/* Route info bar */}
          {routeInfo && (
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-cyan-400/20 p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-800 dark:text-white/90">Route to {camp.name}</p>
                <p className="text-xs text-gray-400">{routeInfo.distanceKm} km · ~{routeInfo.durationMin} min by road</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${camp.latitude},${camp.longitude}&travelmode=driving`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 text-xs font-black hover:bg-cyan-500/25 transition-all flex-shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" /> Google Maps
              </a>
            </div>
          )}

          {/* ── Available Rescue Transport ── */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-blue-400" /> Available Rescue Transport
            </p>
            {rescueMissions.length === 0 ? (
              <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
                <p className="text-xs text-gray-500 font-bold">No active rescue missions right now.</p>
                <p className="text-[10px] text-gray-600 mt-1">Travel by road or check back shortly.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rescueMissions.map((m: any) => {
                  const VIcon = VEHICLE_ICONS[m.vehicle?.type] || Bus
                  const vcol = VEHICLE_COLORS[m.vehicle?.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                  const spotsLeft = Math.max(0, (m.vehicle?.capacity || 0) - (m.evacuatedCount || 0))
                  const isSelected = selectedRescue?.id === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedRescue(isSelected ? null : m)}
                      disabled={m._isFull}
                      className={cn(
                        'w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all',
                        isSelected ? 'border-blue-400/50 bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] hover:border-blue-400/30',
                        m._isFull && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className={cn('p-2 rounded-xl border flex-shrink-0', vcol)}>
                        <VIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {m._isForThisCamp && (
                            <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full uppercase">Going here</span>
                          )}
                          <span className="font-black text-white/90 text-sm">{m.vehicle?.name}</span>
                          <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase', MISSION_STATUS_COLOR[m.status])}>
                            {m.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5"><MapPin className="w-3 h-3 inline" /> {m.area}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {m._dist !== null && <span className="text-xs font-black text-cyan-400">{m._dist.toFixed(1)} km away</span>}
                          <span className={cn('text-xs font-black', m._isFull ? 'text-red-400' : 'text-green-400')}>
                            {m._isFull ? '⚠ FULL' : `${spotsLeft} spots`}
                          </span>
                          {m.vehicle?.contactPhone && (
                            <a href={`tel:${m.vehicle.contactPhone}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-400 flex items-center gap-1 font-bold hover:text-blue-300">
                              <Phone className="w-3 h-3" />{m.vehicle.contactPhone}
                            </a>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-400 font-bold flex-shrink-0 mt-1">{isSelected ? '✓ Selected' : 'Select →'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Mark as Safely Arrived ── */}
          <div className="border-t border-white/10 pt-4">
            {myCheckIn ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-green-400">You have been marked as safely arrived</p>
                  <p className="text-xs text-green-400/70 mt-0.5">Authorities have been notified of your safety.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-bold">Have you arrived at a safe location?</p>
                <button
                  onClick={onMarkSafe}
                  disabled={markingSafe}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 font-black hover:bg-green-500/25 transition-all"
                >
                  {markingSafe ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Mark Me as Safely Arrived
                </button>
                {selectedRescue && (
                  <p className="text-[10px] text-gray-500 text-center">Using {selectedRescue.vehicle?.name} · Contact: {selectedRescue.vehicle?.contactPhone || 'N/A'}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampsPage() {
  const { t } = useTranslation()
  const { searchQuery } = useAppStore()
  const { user } = useAuth()
  const isCitizen = (user as any)?.role === 'CITIZEN'
  const [camps, setCamps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle')
  const [showLocationPicker, setShowLocationPicker] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [newCamp, setNewCamp] = useState({
    name: '',
    location: '',
    totalCapacity: '',
    services: [] as string[]
  })

  const [selectedCampRoute, setSelectedCampRoute] = useState<any>(null)

  // Rescue transport state
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [myCheckIn, setMyCheckIn] = useState<any>(null)
  const [showRescueAdmin, setShowRescueAdmin] = useState(false)
  const [rescueTab, setRescueTab] = useState<'vehicles' | 'missions'>('missions')
  const [markingSafe, setMarkingSafe] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ type: 'BOAT', name: '', capacity: '', area: '', operatorName: '', contactPhone: '', latitude: '', longitude: '' })
  const [showVehicleMapPicker, setShowVehicleMapPicker] = useState(false)
  const [missionForm, setMissionForm] = useState({ vehicleId: '', area: '', destinationCampId: '', notes: '' })

  // Transfer management state
  const [showTransferPanel, setShowTransferPanel] = useState(false)
  const [allTransfers, setAllTransfers] = useState<any[]>([])
  const [transferSuggestions, setTransferSuggestions] = useState<any[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState(false)

  // Supply requests state
  const [showSupplyPanel, setShowSupplyPanel] = useState(false)
  const [supplyRequests, setSupplyRequests] = useState<any[]>([])
  const [loadingSupply, setLoadingSupply] = useState(false)

  const fetchTransferData = async () => {
    setLoadingTransfers(true)
    try {
      const [tRes, sRes] = await Promise.all([campService.getAllTransfers(), campService.getTransferSuggestions()])
      setAllTransfers(tRes.data)
      setTransferSuggestions(sRes.data)
    } catch { /* non-critical */ } finally { setLoadingTransfers(false) }
  }

  const fetchSupplyRequests = async () => {
    setLoadingSupply(true)
    try {
      const res = await supplyRequestService.getAll()
      setSupplyRequests(res.data)
    } catch { /* non-critical */ } finally { setLoadingSupply(false) }
  }

  const fetchRescueData = async () => {
    try {
      const [vRes, mRes] = await Promise.all([rescueService.getVehicles(), rescueService.getMissions()])
      setVehicles(vRes.data)
      setMissions(mRes.data)
    } catch (err) { console.error('Failed to fetch rescue data', err) }
  }

  const fetchMyCheckIn = async () => {
    try {
      const res = await rescueService.getMyZoneStatus()
      setMyCheckIn(res.data)
    } catch {}
  }

  useEffect(() => { fetchRescueData() }, [])
  useEffect(() => { if (isCitizen) fetchMyCheckIn() }, [isCitizen])

  const fetchCamps = async () => {
    try {
      setLoading(true)
      const res = await campService.getCamps()
      setCamps(res.data)
    } catch (err) {
      console.error('Failed to fetch camps', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCamps()
  }, [])

  useEffect(() => {
    if (!isCitizen) return
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      setShowLocationPicker(true)
      return
    }
    setLocationStatus('loading')

    // Show cached location instantly while GPS acquires
    const cached = localStorage.getItem('suraksha_user_location')
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached)
        setUserLocation({ lat, lng })
        setLocationStatus('granted')
        setShowLocationPicker(false)
      } catch { localStorage.removeItem('suraksha_user_location') }
    }

    // Start watching real-time GPS position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        setLocationStatus('granted')
        setShowLocationPicker(false)
        localStorage.setItem('suraksha_user_location', JSON.stringify({ lat, lng }))
      },
      () => {
        // GPS failed — fall back to manual picker if no cached location
        if (!cached) {
          setLocationStatus('denied')
          setShowLocationPicker(true)
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [isCitizen])

  const nearestCamps = userLocation
    ? camps
        .filter(c => c.latitude && c.longitude)
        .map(c => ({ ...c, distanceKm: haversineKm(userLocation.lat, userLocation.lng, c.latitude, c.longitude) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 5)
    : []

  const handleAddCamp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await campService.createCamp({
        ...newCamp,
        ...(pickedLatLng ? { latitude: pickedLatLng.lat, longitude: pickedLatLng.lng } : {}),
      })
      setShowModal(false)
      setNewCamp({ name: '', location: '', totalCapacity: '', services: [] })
      setPickedLatLng(null)
      setShowMapPicker(false)
      fetchCamps()
    } catch (error) {
      console.error('Failed to add camp:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleService = (serviceName: string) => {
    setNewCamp(prev => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter(s => s !== serviceName)
        : [...prev.services, serviceName]
    }))
  }

  const totalPeople = camps.reduce((acc, c) => acc + (c.currentOccupancy || 0), 0)
  const avgOccupancy = camps.length > 0 
    ? Math.round(camps.reduce((acc, c) => acc + (c.totalCapacity > 0 ? (c.currentOccupancy / c.totalCapacity) * 100 : 0), 0) / camps.length)
    : 0

  const stats = [
    { label: t('camps_page.active_camps'), value: camps.length.toString(), color: 'text-blue-600' },
    { label: t('camps_page.people_sheltered'), value: totalPeople.toLocaleString(), color: 'text-green-600' },
    { label: t('camps_page.avg_occupancy'), value: `${avgOccupancy}%`, color: 'text-orange-600' },
    { label: t('camps_page.near_capacity'), value: camps.filter(c => (c.currentOccupancy / c.totalCapacity) > 0.9).length.toString(), color: 'text-red-600' },
  ]

  return (
        <>
          <PageMeta title="Camps | Suraksha" description="Suraksha Camps Page" />
          <PageBreadcrumb pageTitle={t('page_titles.camps')} />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
        {!isCitizen && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowModal(true)}
              className="suraksha-button flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('camps.new_camp')}
            </button>
          </div>
        )}

        {isCitizen && (
          <div className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-black text-slate-800 dark:text-white/90 flex items-center gap-2 text-base">
                <Navigation className="w-5 h-5 text-cyan-400" />
                {t('camps_page.nearest_camps')}
              </h3>
              <div className="flex items-center gap-2">
                {locationStatus === 'loading' && !userLocation && (
                  <span className="text-[10px] text-yellow-400 font-black bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('camps_page.detecting_gps')}
                  </span>
                )}
                {userLocation && (
                  <>
                    <span className="text-[10px] text-green-400 font-black bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      Live · {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem('suraksha_user_location')
                        setUserLocation(null)
                        setShowLocationPicker(true)
                        setLocationStatus('denied')
                      }}
                      className="text-[10px] text-cyan-400 font-black hover:text-cyan-300 transition-colors underline"
                    >
                      {t('camps_page.change')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Map picker — shown on first visit (no saved location) or when user clicks Change */}
            {showLocationPicker && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {t('camps_page.tap_location')}
                </p>
                <div className="rounded-2xl overflow-hidden border border-cyan-400/30" style={{ height: 300 }}>
                  <MapContainer
                    center={userLocation ? [userLocation.lat, userLocation.lng] : [7.8731, 80.7718]}
                    zoom={userLocation ? 12 : 8}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
                    <LocationPicker onPick={(lat, lng) => {
                      setUserLocation({ lat, lng })
                      setLocationStatus('granted')
                      setShowLocationPicker(false)
                      localStorage.setItem('suraksha_user_location', JSON.stringify({ lat, lng }))
                    }} />
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={L.divIcon({
                          className: '',
                          html: `<div style="width:18px;height:18px;background:#06b6d4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(6,182,212,0.25)"></div>`,
                          iconSize: [18, 18], iconAnchor: [9, 9],
                        })}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            {locationStatus === 'granted' && !showLocationPicker && nearestCamps.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nearestCamps.map((camp: any, i: number) => {
                  const available = camp.totalCapacity - camp.currentOccupancy
                  const isFull = available <= 0
                  return (
                    <div key={camp.id} className={`p-4 rounded-2xl border ${i === 0 ? 'border-cyan-400/40 bg-cyan-400/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]'}`}>
                      {i === 0 && <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest">{t('camps_page.closest')}</span>}
                      <h4 className="font-black text-slate-800 dark:text-white/90 text-sm mt-1">{camp.name}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {camp.location}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-black text-cyan-400">{camp.distanceKm.toFixed(1)} km</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${isFull ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                          {isFull ? t('camps_page.full') : `${available} ${t('camps_page.spots')}`}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCampRoute(camp)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {t('camps_page.view_route')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {locationStatus === 'granted' && !showLocationPicker && nearestCamps.length === 0 && (
              <p className="text-sm text-gray-400 font-bold">{t('camps_page.no_camps_nearby')}</p>
            )}
          </div>
        )}

        {/* ── RESCUE TRANSPORT — Citizen View ─────────────────────────────────── */}
        {isCitizen && (() => {
          // Sort active missions: nearest with GPS first, then others; full ones pushed to bottom
          const activeMissions = missions
            .filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
            .map(m => {
              const dist = (userLocation && m.vehicle?.latitude && m.vehicle?.longitude)
                ? haversineKm(userLocation.lat, userLocation.lng, m.vehicle.latitude, m.vehicle.longitude)
                : null
              const isFull = (m.evacuatedCount || 0) >= (m.vehicle?.capacity || Infinity)
              return { ...m, _dist: dist, _isFull: isFull }
            })
            .sort((a, b) => {
              if (a._isFull !== b._isFull) return a._isFull ? 1 : -1
              if (a._dist !== null && b._dist !== null) return a._dist - b._dist
              if (a._dist !== null) return -1
              if (b._dist !== null) return 1
              return 0
            })

          return (
            <div className="suraksha-card bg-white dark:bg-[#131f33] border border-blue-500/20 p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-black text-slate-800 dark:text-white/90 flex items-center gap-2 text-base">
                  <Waves className="w-5 h-5 text-blue-400" />
                  {t('camps_page.available_rescue')}
                </h3>
                {myCheckIn && (
                  <span className="flex items-center gap-1.5 text-xs font-black text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('camps_page.youre_marked_safe')}
                  </span>
                )}
              </div>

              {activeMissions.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold py-2">{t('camps_page.no_active_missions')}</p>
              ) : (
                <div className="space-y-3">
                  {activeMissions.map((mission: any, idx: number) => {
                    const VIcon = VEHICLE_ICONS[mission.vehicle?.type] || Bus
                    const vcol = VEHICLE_COLORS[mission.vehicle?.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                    const spotsLeft = Math.max(0, (mission.vehicle?.capacity || 0) - (mission.evacuatedCount || 0))
                    return (
                      <button
                        key={mission.id}
                        onClick={() => setSelectedMission(mission)}
                        className={cn(
                          'w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all hover:border-blue-400/40 hover:bg-blue-500/5 cursor-pointer',
                          idx === 0 && !mission._isFull ? 'border-blue-400/30 bg-blue-500/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]',
                          mission._isFull && 'opacity-60'
                        )}
                      >
                        <div className={cn('p-2.5 rounded-xl border flex-shrink-0', vcol)}>
                          <VIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {idx === 0 && !mission._isFull && (
                              <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">{t('camps_page.nearest_badge')}</span>
                            )}
                            <span className="font-black text-white/90 text-sm">{mission.vehicle?.name}</span>
                            <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase', MISSION_STATUS_COLOR[mission.status])}>
                              {mission.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-bold mt-0.5">
                            <MapPin className="w-3 h-3 inline mr-0.5" />{mission.area}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {mission._dist !== null && (
                              <span className="text-xs font-black text-cyan-400">{mission._dist.toFixed(1)} km away</span>
                            )}
                            <span className={cn('text-xs font-black', mission._isFull ? 'text-red-400' : 'text-green-400')}>
                              {mission._isFull ? `⚠ ${t('camps_page.full')}` : `${spotsLeft} ${t('camps_page.spots_available')}`}
                            </span>
                            {mission.vehicle?.contactPhone && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{mission.vehicle.contactPhone}
                              </span>
                            )}
                          </div>
                          {mission.notes && <p className="text-xs text-gray-500 mt-1 italic">{mission.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{mission.vehicle?.type}</span>
                          <span className="text-[10px] text-blue-400 font-bold">{t('camps_page.tap_for_route')}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Mark yourself safe */}
              {!myCheckIn ? (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 font-bold mb-3">{t('camps_page.reached_safe')}</p>
                  <button
                    onClick={async () => {
                      setMarkingSafe(true)
                      try {
                        const activeMission = activeMissions.find(m => !m._isFull)
                        await rescueService.markSafeZone({ missionId: activeMission?.id })
                        await fetchMyCheckIn()
                      } catch (err) { console.error(err) }
                      finally { setMarkingSafe(false) }
                    }}
                    disabled={markingSafe}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-black hover:bg-green-500/25 transition-all"
                  >
                    {markingSafe ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {t('camps_page.safe_zone_btn')}
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-white/10 flex items-center gap-3 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-black">{t('camps_page.marked_safe_msg')}</p>
                    <p className="text-xs text-green-400/70">{t('camps_page.safe_notified')}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── RESCUE ADMIN PANEL ─────────────────────────────────────────────── */}
        {!isCitizen && (
          <div className="suraksha-card bg-white dark:bg-[#131f33] border border-blue-500/20 overflow-hidden">
            <button
              onClick={() => setShowRescueAdmin(v => !v)}
              className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Waves className="w-5 h-5 text-blue-400" />
                <span className="font-black text-slate-800 dark:text-white/90 text-base">Rescue Transport Management</span>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {missions.filter(m => m.status === 'IN_PROGRESS').length} Active
                </span>
              </div>
              {showRescueAdmin ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showRescueAdmin && (
              <div className="border-t border-blue-500/20 p-7 space-y-6">
                {/* Tabs */}
                <div className="flex gap-2">
                  {(['missions', 'vehicles'] as const).map(tab => (
                    <button key={tab} onClick={() => setRescueTab(tab)}
                      className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border',
                        rescueTab === tab
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                      )}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* ── MISSIONS TAB ── */}
                {rescueTab === 'missions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">All Rescue Missions</p>
                      <button onClick={() => setShowMissionForm(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-black hover:bg-blue-500/25 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Assign Mission
                      </button>
                    </div>

                    {showMissionForm && (
                      <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-blue-500/20 p-5 space-y-4">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white/90">Create Rescue Mission</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vehicle</label>
                            <select className="suraksha-input w-full text-sm"
                              value={missionForm.vehicleId}
                              onChange={e => setMissionForm(p => ({ ...p, vehicleId: e.target.value }))}>
                              <option value="">Select vehicle…</option>
                              {vehicles.filter(v => v.status === 'AVAILABLE').map((v: any) => (
                                <option key={v.id} value={v.id}>{v.name} ({v.type}) — {v.area}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pickup Area</label>
                            <input className="suraksha-input w-full text-sm" placeholder="e.g. Kelani Valley, Colombo"
                              value={missionForm.area} onChange={e => setMissionForm(p => ({ ...p, area: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Destination Camp (optional)</label>
                            <select className="suraksha-input w-full text-sm"
                              value={missionForm.destinationCampId}
                              onChange={e => setMissionForm(p => ({ ...p, destinationCampId: e.target.value }))}>
                              <option value="">Select camp…</option>
                              {camps.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Notes</label>
                            <input className="suraksha-input w-full text-sm" placeholder="Optional instructions…"
                              value={missionForm.notes} onChange={e => setMissionForm(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={async () => {
                              if (!missionForm.vehicleId || !missionForm.area) return
                              try {
                                await rescueService.createMission({
                                  vehicleId: missionForm.vehicleId,
                                  area: missionForm.area,
                                  destinationCampId: missionForm.destinationCampId || undefined,
                                  notes: missionForm.notes || undefined,
                                })
                                setMissionForm({ vehicleId: '', area: '', destinationCampId: '', notes: '' })
                                setShowMissionForm(false)
                                fetchRescueData()
                              } catch (err) { console.error(err) }
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all">
                            Assign Mission
                          </button>
                          <button onClick={() => setShowMissionForm(false)}
                            className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-black hover:bg-white/10 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {missions.length === 0 ? (
                        <p className="text-sm text-gray-500 font-bold py-4 text-center">No missions yet. Assign one above.</p>
                      ) : missions.map((m: any) => {
                        const VIcon = VEHICLE_ICONS[m.vehicle?.type] || Bus
                        const vcol = VEHICLE_COLORS[m.vehicle?.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                        return (
                          <div key={m.id} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]">
                            <div className={cn('p-2.5 rounded-xl border flex-shrink-0', vcol)}>
                              <VIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-black text-slate-800 dark:text-white/90 text-sm">{m.vehicle?.name}</span>
                                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase', MISSION_STATUS_COLOR[m.status])}>
                                  {m.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-bold">
                                <MapPin className="w-3 h-3 inline mr-0.5" />{m.area}
                                {m.evacuatedCount > 0 && <span className="ml-2 text-green-400">· {m.evacuatedCount} evacuated</span>}
                              </p>
                              {m.notes && <p className="text-xs text-gray-500 italic mt-0.5">{m.notes}</p>}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {(m.safeZoneCheckIns?.length || 0) > 0 ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {m.safeZoneCheckIns.length} citizen{m.safeZoneCheckIns.length > 1 ? 's' : ''} marked safe
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-600">No check-ins yet</span>
                                )}
                                {m.assignedBy?.name && <span className="text-[10px] text-gray-600">Assigned by {m.assignedBy.name}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              {m.status === 'PENDING' && (
                                <button onClick={async () => { await rescueService.updateMissionStatus(m.id, 'IN_PROGRESS'); fetchRescueData() }}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black hover:bg-blue-500/25 transition-all">
                                  Start
                                </button>
                              )}
                              {m.status === 'IN_PROGRESS' && (
                                <button onClick={async () => { await rescueService.updateMissionStatus(m.id, 'COMPLETED', m.safeZoneCheckIns?.length); fetchRescueData() }}
                                  className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black hover:bg-green-500/25 transition-all flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Job Done {m.safeZoneCheckIns?.length > 0 ? `(${m.safeZoneCheckIns.length} safe)` : ''}
                                </button>
                              )}
                              {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                                <button onClick={async () => { await rescueService.updateMissionStatus(m.id, 'CANCELLED'); fetchRescueData() }}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black hover:bg-red-500/20 transition-all">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── VEHICLES TAB ── */}
                {rescueTab === 'vehicles' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Registered Vehicles</p>
                      <button onClick={() => setShowVehicleForm(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-black hover:bg-blue-500/25 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Vehicle
                      </button>
                    </div>

                    {showVehicleForm && (
                      <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-blue-500/20 p-5 space-y-4">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white/90">Register Rescue Vehicle</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</label>
                            <select className="suraksha-input w-full text-sm"
                              value={vehicleForm.type}
                              onChange={e => setVehicleForm(p => ({ ...p, type: e.target.value }))}>
                              {['BOAT', 'BUS', 'VAN', 'TRUCK', 'HELICOPTER', 'AMBULANCE'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Name / Unit</label>
                            <input className="suraksha-input w-full text-sm" placeholder="e.g. SL Army Boat Unit 3"
                              value={vehicleForm.name} onChange={e => setVehicleForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Capacity</label>
                            <input type="number" className="suraksha-input w-full text-sm" placeholder="e.g. 25"
                              value={vehicleForm.capacity} onChange={e => setVehicleForm(p => ({ ...p, capacity: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deployed Area</label>
                            <input className="suraksha-input w-full text-sm" placeholder="e.g. Kelani Valley"
                              value={vehicleForm.area} onChange={e => setVehicleForm(p => ({ ...p, area: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Operator / Unit</label>
                            <input className="suraksha-input w-full text-sm" placeholder="e.g. SL Army"
                              value={vehicleForm.operatorName} onChange={e => setVehicleForm(p => ({ ...p, operatorName: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Phone</label>
                            <input className="suraksha-input w-full text-sm" placeholder="+94XXXXXXXXX"
                              value={vehicleForm.contactPhone} onChange={e => setVehicleForm(p => ({ ...p, contactPhone: e.target.value }))} />
                          </div>
                        </div>
                        {/* Pickup location picker */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pickup Location on Map</label>
                            <button type="button" onClick={() => setShowVehicleMapPicker(v => !v)}
                              className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors">
                              {showVehicleMapPicker ? 'Hide Map' : 'Pick on Map'}
                            </button>
                          </div>
                          {vehicleForm.latitude && vehicleForm.longitude && (
                            <p className="text-[11px] text-cyan-400 font-bold">
                              📍 {parseFloat(vehicleForm.latitude).toFixed(4)}, {parseFloat(vehicleForm.longitude).toFixed(4)}
                            </p>
                          )}
                          {showVehicleMapPicker && (
                            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 220 }}>
                              <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <LocationPicker onPick={(lat, lng) => {
                                  setVehicleForm(p => ({ ...p, latitude: String(lat), longitude: String(lng) }))
                                  setShowVehicleMapPicker(false)
                                }} />
                                {vehicleForm.latitude && vehicleForm.longitude && (
                                  <Marker position={[parseFloat(vehicleForm.latitude), parseFloat(vehicleForm.longitude)]} icon={createPickerIcon()} />
                                )}
                              </MapContainer>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={async () => {
                              if (!vehicleForm.name || !vehicleForm.area || !vehicleForm.capacity) return
                              try {
                                await rescueService.createVehicle({
                                  ...vehicleForm,
                                  capacity: Number(vehicleForm.capacity),
                                  latitude: vehicleForm.latitude ? Number(vehicleForm.latitude) : undefined,
                                  longitude: vehicleForm.longitude ? Number(vehicleForm.longitude) : undefined,
                                })
                                setVehicleForm({ type: 'BOAT', name: '', capacity: '', area: '', operatorName: '', contactPhone: '', latitude: '', longitude: '' })
                                setShowVehicleForm(false)
                                fetchRescueData()
                              } catch (err) { console.error(err) }
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all">
                            Register Vehicle
                          </button>
                          <button onClick={() => setShowVehicleForm(false)}
                            className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-black hover:bg-white/10 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {vehicles.length === 0 ? (
                        <p className="text-sm text-gray-500 font-bold py-4 text-center">No vehicles registered yet.</p>
                      ) : vehicles.map((v: any) => {
                        const VIcon = VEHICLE_ICONS[v.type] || Bus
                        const vcol = VEHICLE_COLORS[v.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                        return (
                          <div key={v.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a]">
                            <div className={cn('p-2.5 rounded-xl border flex-shrink-0', vcol)}>
                              <VIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-slate-800 dark:text-white/90 text-sm">{v.name}</span>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase bg-gray-500/10 text-gray-400 border-gray-500/30">{v.type}</span>
                                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase',
                                  v.status === 'AVAILABLE' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30')}>
                                  {v.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-bold mt-0.5">
                                <MapPin className="w-3 h-3 inline mr-0.5" />{v.area} · Capacity: {v.capacity}
                                {v.operatorName && ` · ${v.operatorName}`}
                              </p>
                            </div>
                            <button onClick={async () => { await rescueService.deleteVehicle(v.id); fetchRescueData() }}
                              className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSFER MANAGEMENT PANEL ────────────────────────────────────── */}
        {!isCitizen && (
          <div className="suraksha-card bg-white dark:bg-[#131f33] border border-orange-500/20 overflow-hidden">
            <button
              onClick={() => { setShowTransferPanel(v => !v); if (!showTransferPanel) fetchTransferData(); }}
              className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                <span className="font-black text-slate-800 dark:text-white/90 text-base">Inter-Camp Transfer Management</span>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {allTransfers.filter(t => t.status === 'PENDING').length} Pending
                </span>
              </div>
              {showTransferPanel ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showTransferPanel && (
              <div className="border-t border-orange-500/20 p-7 space-y-8">
                {loadingTransfers ? (
                  <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Loading transfer data…</div>
                ) : (
                  <>
                    {/* Suggestions for full camps */}
                    {transferSuggestions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" /> Full Camps — Transfer Suggestions
                        </p>
                        <div className="space-y-4">
                          {transferSuggestions.map((s: any, i: number) => (
                            <div key={i} className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-black text-red-300 text-sm">{s.fullCamp.name}</p>
                                  <p className="text-xs text-red-400/70">{s.fullCamp.currentOccupancy}/{s.fullCamp.totalCapacity} residents · {s.fullCamp.location}</p>
                                </div>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">FULL</span>
                              </div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Suggested destinations</p>
                              <div className="space-y-2">
                                {s.suggestions.map((dest: any) => (
                                  <div key={dest.id} className="flex items-center justify-between bg-green-500/8 border border-green-500/15 rounded-lg px-3 py-2">
                                    <div>
                                      <p className="text-sm font-bold text-green-300">{dest.name}</p>
                                      <p className="text-xs text-green-400/70">
                                        {dest.freeCapacity} free · {dest.distanceKm != null ? `${dest.distanceKm.toFixed(1)} km away` : dest.location}
                                      </p>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        const count = parseInt(prompt(`Transfer how many people from ${s.fullCamp.name} to ${dest.name}?`) || '0');
                                        if (!count || count <= 0) return;
                                        try { await campService.createTransfer(s.fullCamp.id, dest.id, count); fetchTransferData(); } catch {}
                                      }}
                                      className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                                    >
                                      Transfer →
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All transfer requests */}
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">All Transfer Requests</p>
                      {allTransfers.length === 0 ? (
                        <p className="text-sm text-slate-500 font-bold">No transfer requests yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {allTransfers.map((tr: any) => (
                            <div key={tr.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-white/90 truncate">
                                  {tr.fromCamp?.name} → {tr.toCamp?.name}
                                </p>
                                <p className="text-xs text-slate-400">{tr.peopleCount} people · {new Date(tr.requestDate).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border',
                                  tr.status === 'APPROVED' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                                  tr.status === 'COMPLETED' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                  tr.status === 'REJECTED' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                )}>{tr.status}</span>
                                {tr.status === 'PENDING' && (
                                  <>
                                    <button onClick={async () => { await campService.updateTransfer(tr.id, 'APPROVED'); fetchTransferData(); }}
                                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors">Approve</button>
                                    <button onClick={async () => { await campService.updateTransfer(tr.id, 'REJECTED'); fetchTransferData(); }}
                                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-600/70 text-white hover:bg-red-500 transition-colors">Reject</button>
                                  </>
                                )}
                                {tr.status === 'APPROVED' && (
                                  <button onClick={async () => { await campService.updateTransfer(tr.id, 'COMPLETED'); fetchTransferData(); }}
                                    className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">Mark Done</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SUPPLY REQUEST MANAGEMENT PANEL ──────────────────────────────── */}
        {!isCitizen && (
          <div className="suraksha-card bg-white dark:bg-[#131f33] border border-purple-500/20 overflow-hidden">
            <button
              onClick={() => { setShowSupplyPanel(v => !v); if (!showSupplyPanel) fetchSupplyRequests(); }}
              className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-purple-400" />
                <span className="font-black text-slate-800 dark:text-white/90 text-base">Supply Requests</span>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {supplyRequests.filter(r => r.status === 'PENDING').length} Pending
                </span>
              </div>
              {showSupplyPanel ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showSupplyPanel && (
              <div className="border-t border-purple-500/20 p-7">
                {loadingSupply ? (
                  <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Loading supply requests…</div>
                ) : supplyRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 font-bold">No supply requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {supplyRequests.map((r: any) => (
                      <div key={r.id} className="flex items-start justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border',
                              r.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              r.urgency === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                              r.urgency === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-green-500/20 text-green-400 border-green-500/30'
                            )}>{r.urgency}</span>
                            <p className="text-sm font-bold text-slate-800 dark:text-white/90 truncate">{r.itemType} × {r.quantity}</p>
                          </div>
                          <p className="text-xs text-slate-400">
                            {r.requester?.name}{r.camp ? ` · ${r.camp.name}` : ''} · {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                          {r.notes && <p className="text-xs text-slate-500 italic mt-0.5">"{r.notes}"</p>}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border',
                            r.status === 'FULFILLED' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                            r.status === 'DISPATCHED' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                            r.status === 'APPROVED' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                            r.status === 'REJECTED' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                          )}>{r.status}</span>
                          {r.status === 'PENDING' && (
                            <div className="flex gap-1 mt-1">
                              <button onClick={async () => { await supplyRequestService.updateStatus(r.id, 'APPROVED'); fetchSupplyRequests(); }}
                                className="text-[9px] font-black px-2 py-1 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors">Approve</button>
                              <button onClick={async () => { await supplyRequestService.updateStatus(r.id, 'REJECTED'); fetchSupplyRequests(); }}
                                className="text-[9px] font-black px-2 py-1 rounded-lg bg-red-600/70 text-white hover:bg-red-500 transition-colors">Reject</button>
                            </div>
                          )}
                          {r.status === 'APPROVED' && (
                            <button onClick={async () => { await supplyRequestService.updateStatus(r.id, 'DISPATCHED'); fetchSupplyRequests(); }}
                              className="text-[9px] font-black px-2 py-1 mt-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">Dispatch</button>
                          )}
                          {r.status === 'DISPATCHED' && (
                            <button onClick={async () => { await supplyRequestService.updateStatus(r.id, 'FULFILLED'); fetchSupplyRequests(); }}
                              className="text-[9px] font-black px-2 py-1 mt-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors">Fulfilled</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all">
               <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
               <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white dark:bg-[#131f33] border border-cyan-400/20 rounded-[1.5rem] shadow-sm space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{t('camps_page.loading')}</p>
            </div>
          ) : camps.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
             <div className="lg:col-span-2 text-center py-24 bg-white dark:bg-[#131f33] border border-cyan-400/20 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-gray-700">
               <div className="bg-gray-50 dark:bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-slate-300" />
               </div>
               <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">{searchQuery ? t('camps_page.no_matching') : t('camps_page.no_registered')}</p>
             </div>
          ) : (
            camps.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase())).map((camp, idx) => {
              const percent = Math.round((camp.currentOccupancy / camp.totalCapacity) * 100)
              const status = percent >= 80 ? 'HIGH' : percent > 50 ? 'MODERATE' : 'LOW'
              const statusColor = status === 'HIGH' ? 'bg-red-500/15 text-red-400 border-red-500/30' : status === 'MODERATE' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-green-500/15 text-green-400 border-green-500/30'
              const barColor = status === 'HIGH' ? 'bg-red-500' : status === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'

              return (
                <div key={idx} className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 p-7 flex flex-col space-y-6 hover:shadow-lg transition-all relative group rounded-[1.5rem]">
                  <div className="absolute top-7 right-7">
                    <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase border", statusColor)}>{status}</span>
                  </div>
                  <div className="pr-20">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white/90">{camp.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-bold mt-1">
                      <MapPin className="w-4 h-4 text-slate-300" />
                      {camp.location}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500">{t('camps_page.occupancy')}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">{camp.currentOccupancy}/{camp.totalCapacity} ({percent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500">{t('camps_page.available_services')}</span>
                    <div className="flex flex-wrap gap-2">
                      {camp.services && camp.services.length > 0 ? camp.services.map((sName: string) => {
                        const s = servicesList.find(t => t.name === sName);
                        if (!s) return null;
                        return (
                          <div key={sName} className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg border border-cyan-400/20">
                            <s.icon className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold lowercase">{sName}</span>
                          </div>
                        );
                      }) : <span className="text-xs text-slate-300 italic">{t('camps_page.no_services')}</span>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold">{t('camps_page.wait_time')} <span className="text-gray-800 dark:text-white/90 font-extrabold">{camp.waitTime || 'N/A'}</span></span>
                    </div>
                    <button onClick={() => setSelectedCampId(camp.id)} className="text-sm font-bold text-brand-500 hover:underline">
                      {isCitizen ? 'View Details' : t('camps_page.manage_camp')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {selectedCampId && <CampDetailsModal campId={selectedCampId} onClose={() => { setSelectedCampId(null); fetchCamps(); }} isCitizen={isCitizen} />}
        {selectedMission && <RescueDetailModal mission={selectedMission} userLocation={userLocation} onClose={() => setSelectedMission(null)} />}
        {selectedCampRoute && userLocation && (
          <CampRouteModal
            camp={selectedCampRoute}
            userLocation={userLocation}
            missions={missions}
            myCheckIn={myCheckIn}
            onMarkSafe={async () => {
              setMarkingSafe(true)
              try {
                const m = missions.find(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && !(m.evacuatedCount >= m.vehicle?.capacity))
                await rescueService.markSafeZone({ missionId: m?.id })
                await fetchMyCheckIn()
              } catch (err) { console.error(err) }
              finally { setMarkingSafe(false) }
            }}
            markingSafe={markingSafe}
            onClose={() => setSelectedCampRoute(null)}
          />
        )}

        {showModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#131f33] border border-cyan-400/20 w-full max-w-xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="px-8 py-6 border-b border-cyan-400/20 flex items-center justify-between bg-slate-50 dark:bg-[#0f172a]">
                <h2 className="text-xl font-black text-slate-800 dark:text-white/90">{t('camps_page.register_new_camp')}</h2>
                <button onClick={() => { setShowModal(false); setShowMapPicker(false); setPickedLatLng(null); }} className="text-cyan-400/70 hover:text-cyan-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddCamp} className="p-8 space-y-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('camps_page.camp_name')}</label>
                     <input required className="suraksha-input" value={newCamp.name} onChange={(e) => setNewCamp({...newCamp, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('camps_page.location')}</label>
                     <div className="flex gap-2">
                       <input
                         required
                         className="suraksha-input flex-1"
                         placeholder="e.g. Homagama, Colombo"
                         value={newCamp.location}
                         onChange={(e) => setNewCamp({...newCamp, location: e.target.value})}
                       />
                       <button
                         type="button"
                         onClick={() => setShowMapPicker(v => !v)}
                         className={cn(
                           "px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5",
                           showMapPicker
                             ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                             : "bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-cyan-400/30 hover:text-slate-700 dark:hover:text-slate-200"
                         )}
                       >
                         <MapPin className="w-3.5 h-3.5" />
                         {pickedLatLng ? 'Change Pin' : 'Pick on Map'}
                       </button>
                     </div>

                     {/* Coordinates badge */}
                     {pickedLatLng && (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-xs text-cyan-300 font-bold">
                         <MapPin className="w-3 h-3 shrink-0" />
                         {pickedLatLng.lat.toFixed(5)}, {pickedLatLng.lng.toFixed(5)}
                         <button type="button" onClick={() => setPickedLatLng(null)} className="ml-auto text-cyan-400/60 hover:text-red-400 transition-colors">
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     )}

                     {/* Map picker */}
                     {showMapPicker && (
                       <div className="rounded-2xl overflow-hidden border border-cyan-400/30 mt-1" style={{ height: 260 }}>
                         <MapContainer
                           center={[7.8731, 80.7718]}
                           zoom={8}
                           style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
                           zoomControl={true}
                         >
                           <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                           <LocationPicker onPick={(lat, lng) => {
                             setPickedLatLng({ lat, lng })
                             if (!newCamp.location) {
                               setNewCamp(prev => ({ ...prev, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }))
                             }
                           }} />
                           {pickedLatLng && (
                             <Marker position={[pickedLatLng.lat, pickedLatLng.lng]} icon={createPickerIcon()}>
                               <Popup>Camp location</Popup>
                             </Marker>
                           )}
                         </MapContainer>
                       </div>
                     )}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('camps_page.total_capacity')}</label>
                     <input required type="number" className="suraksha-input" value={newCamp.totalCapacity} onChange={(e) => setNewCamp({...newCamp, totalCapacity: e.target.value})} />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('camps_page.services_available')}</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {servicesList.map((service) => (
                       <button key={service.name} type="button" onClick={() => toggleService(service.name)} className={cn("flex flex-col items-center justify-center p-4 rounded-2xl border transition-all space-y-2", newCamp.services.includes(service.name) ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm" : "bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-cyan-400/30 hover:text-slate-700 dark:hover:text-slate-200")}>
                         <service.icon className="w-6 h-6" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">{service.name}</span>
                       </button>
                     ))}
                   </div>
                 </div>
                 <div className="pt-4 flex gap-4">
                   <button type="button" onClick={() => { setShowModal(false); setShowMapPicker(false); setPickedLatLng(null); }} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 text-slate-600 dark:text-cyan-400/70 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-cyan-900/20 transition-all">{t('camps_page.cancel')}</button>
                   <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-4 bg-brand-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25">{t('camps_page.create_camp')}</button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
        </>
      )
}

function CampDetailsModal({ campId, onClose, isCitizen = false }: { campId: string, onClose: () => void, isCitizen?: boolean }) {
  const { t } = useTranslation()
  const [camp, setCamp] = useState<any>(null)
  const [campError, setCampError] = useState(false)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESIDENTS' | 'INVENTORY' | 'SCHEDULE' | 'REFERRALS'>('OVERVIEW')

  const fetchCamp = async () => {
    try {
      const res = await campService.getCampById(campId)
      setCamp(res.data)
    } catch {
      setCampError(true)
    }
  }

  const [showTransferModal, setShowTransferModal] = useState(false)

  useEffect(() => {
    fetchCamp()
  }, [campId])

  if (campError) return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full text-center shadow-xl">
        <p className="text-red-500 font-semibold">Failed to load camp details.</p>
        <button onClick={onClose} className="suraksha-button px-6">Close</button>
      </div>
    </div>
  )

  if (!camp) return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </div>
  )

  const occupancyRate = camp.currentOccupancy / camp.totalCapacity
  const isSurging = occupancyRate >= 0.8

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131f33] border border-cyan-400/20 w-full max-w-6xl rounded-[1.5rem] shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-8 py-6 border-b border-cyan-400/20 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#0f172a] rounded-t-[1.5rem]">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white/90 flex items-center gap-3">
              {camp.name}
              {isSurging && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {t('camps_page.overview.surge_active')}</span>}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {camp.location}</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 text-slate-500 dark:text-cyan-400/70 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-cyan-900/20"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-8 border-b border-cyan-400/20 shrink-0 overflow-x-auto bg-slate-50 dark:bg-[#0f172a]">
          {[
            { id: 'OVERVIEW', label: t('camps_page.tabs.overview'), icon: Building2 },
            ...(!isCitizen ? [
              { id: 'RESIDENTS', label: t('camps_page.tabs.digital_roll'), icon: Users },
              { id: 'INVENTORY', label: t('camps_page.tabs.supply_inventory'), icon: PieChart },
              { id: 'SCHEDULE', label: t('camps_page.tabs.services_schedule'), icon: ListTodo },
              { id: 'REFERRALS', label: t('camps_page.tabs.hospital_referrals'), icon: Stethoscope },
            ] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn("flex items-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 whitespace-nowrap", activeTab === tab.id ? "border-brand-500 text-brand-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300")}
            >
              <tab.icon className="w-4 h-4"/> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#0f172a]">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {isSurging && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-red-400 font-black text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> {t('camps_page.overview.capacity_surge_alert')}</h4>
                    <p className="text-red-300 text-sm mt-1">This camp is at {Math.round(occupancyRate * 100)}% capacity. Recommend immediate inter-camp transfers.</p>
                  </div>
                  {!isCitizen && <button onClick={() => setShowTransferModal(true)} className="bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">{t('camps_page.overview.initiate_transfer')}</button>}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="suraksha-card p-6 bg-white dark:bg-[#131f33] border border-cyan-400/20 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t('camps_page.overview.current_occupancy')}</h4>
                    <div className="text-3xl font-black text-gray-800 dark:text-white/90">{camp.currentOccupancy} <span className="text-lg text-gray-400 dark:text-gray-500">/ {camp.totalCapacity}</span></div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
                      <div className={cn("h-full rounded-full", isSurging ? 'bg-red-500' : 'bg-green-500')} style={{width: `${Math.round(occupancyRate * 100)}%`}} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{t('camps_page.overview.transfers')}</h4>
                    <div className="flex gap-4">
                      <div className="bg-slate-100 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-cyan-400/20 flex-1 text-center">
                        <div className="text-2xl font-black text-blue-600">{camp.transfersIn?.length || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.overview.pending_inbound')}</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-cyan-400/20 flex-1 text-center">
                        <div className="text-2xl font-black text-orange-600">{camp.transfersOut?.length || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.overview.pending_outbound')}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 overflow-hidden h-64 lg:h-auto relative min-h-[300px]">
                  {camp.latitude && camp.longitude ? (
                    <MapContainer center={[camp.latitude, camp.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={[camp.latitude, camp.longitude]} icon={createCampIcon()} />
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <MapPin className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-sm font-bold">{t('camps_page.overview.gps_unavailable')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RESIDENTS' && <ResidentsTab campId={camp.id} residents={camp.residents} refresh={fetchCamp} />}
          {activeTab === 'INVENTORY' && <InventoryTab campId={camp.id} inventory={camp.inventory} refresh={fetchCamp} />}
          {activeTab === 'SCHEDULE' && <ScheduleTab campId={camp.id} schedules={camp.schedules} refresh={fetchCamp} />}
          {activeTab === 'REFERRALS' && <ReferralsTab campId={camp.id} referrals={camp.referrals} refresh={fetchCamp} />}
        </div>
      </div>
      {showTransferModal && <TransferModal fromCamp={camp} onClose={() => setShowTransferModal(false)} refresh={fetchCamp} />}
    </div>
  )
}

function ResidentsTab({ campId, residents, refresh }: any) {
  const { t } = useTranslation()
  const { alert } = useDialog()
  const [name, setName] = useState('')
  const [nic, setNic] = useState('')

  const handleAdd = async (e: any) => {
    e.preventDefault()
    try {
      const res = await campService.addResident(campId, { name, nic })
      if (res.data.isMissingPersonMatch) {
        await alert('CRITICAL: This resident matched a Missing Person report! Authorities have been notified.', { variant: 'warning', title: 'Missing Person Match' })
      }
      setName('')
      setNic('')
      refresh()
    } catch (e) {
      await alert('Failed to register resident', { variant: 'danger', title: 'Registration failed' })
    }
  }

  const handleCheckout = async (id: string) => {
    await campService.checkoutResident(id)
    refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-[#131f33] border border-cyan-400/20 flex flex-col md:flex-row items-end gap-4 shadow-sm border-blue-100">
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.full_name')}</label>
           <input required className="suraksha-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Resident Name" />
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.nic_optional')}</label>
           <input className="suraksha-input" value={nic} onChange={e=>setNic(e.target.value)} placeholder="ID Number" />
         </div>
         <button type="submit" className="suraksha-button h-12 px-8 w-full md:w-auto">{t('camps_page.residents.register_resident')}</button>
      </form>
      <div className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-[#0f172a]">
            <tr>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.name')}</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.nic')}</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.check_in')}</th>
              <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.residents.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {residents.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-bold flex items-center gap-2">
                  {r.name}
                </td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{r.nic || '-'}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(r.checkInTime).toLocaleString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleCheckout(r.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors">{t('camps_page.residents.checkout')}</button>
                </td>
              </tr>
            ))}
            {residents.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500 italic font-bold">{t('camps_page.residents.no_residents')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventoryTab({ campId, inventory, refresh }: any) {
  const { t } = useTranslation()
  const items = ['FOOD', 'WATER', 'MEDICAL', 'BLANKETS', 'HYGIENE']
  
  const handleUpdate = async (itemType: string, qty: string) => {
    await campService.updateInventory(campId, { itemType, quantity: parseInt(qty) })
    refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {items.map(type => {
         const inv = inventory.find((i: any) => i.itemType === type) || { quantity: 0, threshold: 100 }
         const status = inv.quantity > inv.threshold * 1.5 ? 'GREEN' : inv.quantity > inv.threshold ? 'AMBER' : 'RED'
         const color = status === 'GREEN' ? 'text-green-400 bg-green-500/10 border-green-500/30' : status === 'AMBER' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
         
         return (
           <div key={type} className={cn("suraksha-card p-6 border-2 transition-colors", color)}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-sm uppercase tracking-widest">{type}</span>
                <span className={cn("w-3 h-3 rounded-full shadow-inner", status === 'GREEN' ? 'bg-green-500' : status === 'AMBER' ? 'bg-yellow-500' : 'bg-red-500')} />
              </div>
              <div className="text-3xl font-black mb-1">{inv.quantity} <span className="text-xs opacity-50 font-bold uppercase tracking-widest">{t('camps_page.inventory.units')}</span></div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-6">{t('camps_page.inventory.threshold')} {inv.threshold}</div>
              
              <div className="flex gap-2">
                <button onClick={() => handleUpdate(type, (inv.quantity + 50).toString())} className="flex-1 bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 text-slate-700 dark:text-white text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm">+50</button>
                <button onClick={() => handleUpdate(type, Math.max(0, inv.quantity - 10).toString())} className="flex-1 bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 text-slate-700 dark:text-white text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm">-10</button>
              </div>
           </div>
         )
       })}
    </div>
  )
}

function ScheduleTab({ campId, schedules, refresh }: any) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ activityName: '', startTime: '', endTime: '', type: 'MEAL' })
  
  const handleAdd = async (e: any) => {
    e.preventDefault()
    await campService.addSchedule(campId, form)
    setForm({ activityName: '', startTime: '', endTime: '', type: 'MEAL' })
    refresh()
  }

  const handleDelete = async (id: string) => {
    await campService.deleteSchedule(id)
    refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1">
         <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-[#131f33] border border-cyan-400/20 space-y-4 shadow-sm">
           <h3 className="font-black uppercase tracking-widest text-sm mb-4">{t('camps_page.schedule.add_entry')}</h3>
           <input required className="suraksha-input" placeholder="Activity Name" value={form.activityName} onChange={e=>setForm({...form, activityName: e.target.value})} />
           <div className="flex gap-2">
             <input required type="time" className="suraksha-input" value={form.startTime} onChange={e=>setForm({...form, startTime: e.target.value})} />
             <input required type="time" className="suraksha-input" value={form.endTime} onChange={e=>setForm({...form, endTime: e.target.value})} />
           </div>
           <select className="suraksha-input" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
             <option value="MEAL">{t('camps_page.schedule.meal_time')}</option>
             <option value="MEDICAL">{t('camps_page.schedule.medical_clinic')}</option>
             <option value="COUNSELING">{t('camps_page.schedule.counseling')}</option>
             <option value="ACTIVITY">{t('camps_page.schedule.general_activity')}</option>
           </select>
           <button type="submit" className="suraksha-button w-full">{t('camps_page.schedule.publish_qr')}</button>
         </form>
       </div>
       <div className="lg:col-span-2">
         <div className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 shadow-sm p-6 space-y-4">
           {schedules.map((s: any) => (
             <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 rounded-2xl">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">{s.startTime}</div>
                 <div>
                   <h4 className="font-black text-sm">{s.activityName}</h4>
                   <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{s.type} • {t('camps_page.schedule.till')} {s.endTime}</span>
                 </div>
               </div>
               <button onClick={() => handleDelete(s.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500"><X className="w-5 h-5"/></button>
             </div>
           ))}
           {schedules.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 italic text-sm font-bold py-10">{t('camps_page.schedule.no_schedules')}</p>}
         </div>
       </div>
    </div>
  )
}

function ReferralsTab({ campId, referrals, refresh }: any) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ patientName: '', hospitalId: '', hospitalAssigned: '', conditionSeverity: 'MEDIUM' })
  const [hospitals, setHospitals] = useState<{ id: string; name: string; availableBeds: number }[]>([])

  useEffect(() => {
    hospitalApi.listHospitals().then(setHospitals).catch(() => {})
  }, [])

  const handleAdd = async (e: any) => {
    e.preventDefault()
    const selected = hospitals.find(h => h.id === form.hospitalId)
    await campService.addReferral(campId, {
      patientName: form.patientName,
      conditionSeverity: form.conditionSeverity,
      hospitalId: form.hospitalId || undefined,
      hospitalName: selected?.name ?? form.hospitalAssigned,
    })
    setForm({ patientName: '', hospitalId: '', hospitalAssigned: '', conditionSeverity: 'MEDIUM' })
    refresh()
  }

  const handleUpdate = async (id: string, status: string) => {
    await campService.updateReferral(id, status)
    refresh()
  }

  return (
    <div className="space-y-6">
       <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-[#131f33] border border-cyan-400/20 flex flex-col md:flex-row items-end gap-4 shadow-sm border-blue-100">
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.patient_name')}</label>
           <input required className="suraksha-input" value={form.patientName} onChange={e=>setForm({...form, patientName: e.target.value})} placeholder="Name" />
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.hospital')}</label>
           {hospitals.length > 0 ? (
             <select required className="suraksha-input" value={form.hospitalId} onChange={e => setForm({ ...form, hospitalId: e.target.value })}>
               <option value="">Select hospital…</option>
               {hospitals.map(h => (
                 <option key={h.id} value={h.id}>{h.name} ({h.availableBeds} beds avail.)</option>
               ))}
             </select>
           ) : (
             <input required className="suraksha-input" value={form.hospitalAssigned} onChange={e=>setForm({...form, hospitalAssigned: e.target.value})} placeholder="e.g. General Hospital" />
           )}
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.severity')}</label>
           <select className="suraksha-input" value={form.conditionSeverity} onChange={e=>setForm({...form, conditionSeverity: e.target.value})}>
             <option value="LOW">Low</option>
             <option value="MEDIUM">Medium</option>
             <option value="HIGH">High</option>
             <option value="CRITICAL">Critical</option>
           </select>
         </div>
         <button type="submit" className="suraksha-button h-12 px-8 w-full md:w-auto">{t('camps_page.referrals.log_referral')}</button>
      </form>

      <div className="suraksha-card bg-white dark:bg-[#131f33] border border-cyan-400/20 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-[#0f172a]">
            <tr>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.patient')}</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.hospital')}</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.severity')}</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.referrals.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {referrals.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-bold">{r.patientName}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{r.hospitalName || r.hospitalAssigned || '—'}</td>
                <td className="p-4">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest", r.conditionSeverity === 'CRITICAL' ? 'bg-red-500/15 text-red-400' : r.conditionSeverity === 'HIGH' ? 'bg-orange-500/15 text-orange-400' : 'bg-white/10 text-slate-300')}>{r.conditionSeverity}</span>
                </td>
                <td className="p-4">
                   <select 
                     className="text-xs font-bold bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-cyan-400/20 text-slate-700 dark:text-cyan-400 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-cyan-400/50"
                     value={r.status}
                     onChange={(e) => handleUpdate(r.id, e.target.value)}
                   >
                     <option value="PENDING">{t('camps_page.referrals.pending')}</option>
                     <option value="IN_TRANSIT">{t('camps_page.referrals.in_transit')}</option>
                     <option value="ADMITTED">{t('camps_page.referrals.admitted')}</option>
                     <option value="DISCHARGED">{t('camps_page.referrals.discharged')}</option>
                   </select>
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500 italic font-bold">{t('camps_page.referrals.no_referrals')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransferModal({ fromCamp, onClose, refresh }: any) {
  const { t } = useTranslation()
  const { alert } = useDialog()
  const [camps, setCamps] = useState<any[]>([])
  const [toCampId, setToCampId] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    campService.getCamps().then(res => {
      // Filter out current camp and camps that are already full
      const available = res.data.filter((c: any) => c.id !== fromCamp.id && (c.currentOccupancy / c.totalCapacity) < 0.8)
      setCamps(available)
    })
  }, [fromCamp.id])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      await campService.createTransfer(fromCamp.id, toCampId, parseInt(peopleCount))
      await alert('Transfer request submitted to HQ.', { variant: 'success', title: 'Transfer submitted' })
      onClose()
      refresh()
    } catch(e) {
      await alert('Failed to submit transfer', { variant: 'danger', title: 'Transfer failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#131f33] border border-cyan-400/20 w-full max-w-md rounded-[1.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-black text-gray-800 dark:text-white/90 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5"/> {t('camps_page.transfer.title')}</h3>
           <button onClick={onClose}><X className="w-5 h-5 text-gray-400 dark:text-gray-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.transfer.destination')}</label>
             <select required className="suraksha-input" value={toCampId} onChange={e=>setToCampId(e.target.value)}>
               <option value="">Select an available camp...</option>
               {camps.map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.totalCapacity - c.currentOccupancy} spots available)</option>
               ))}
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('camps_page.transfer.number_of_people')}</label>
             <input required type="number" max={fromCamp.currentOccupancy} className="suraksha-input" value={peopleCount} onChange={e=>setPeopleCount(e.target.value)} placeholder="0" />
           </div>
           <div className="pt-4 flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 text-slate-600 dark:text-cyan-400/70 hover:bg-slate-200 dark:hover:bg-cyan-900/20 rounded-xl py-3 font-bold text-sm transition-colors">{t('camps_page.transfer.cancel')}</button>
             <button type="submit" disabled={loading || !toCampId} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-bold text-sm">{t('camps_page.transfer.submit')}</button>
           </div>
        </form>
      </div>
    </div>
  )
}
