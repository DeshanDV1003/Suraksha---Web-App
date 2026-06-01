import { useEffect, useState } from 'react'
import { 
  Building2, Users, PieChart, AlertTriangle, 
  Utensils, Droplets, Heart, Zap, Bath, 
  UserCheck, Baby, Accessibility, Clock, MapPin, Plus, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { campService } from '../services/api'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

export default function CampsPage() {
  const { t } = useTranslation()
  const { searchQuery } = useAppStore()
  const [camps, setCamps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCamp, setSelectedCamp] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCamp, setNewCamp] = useState({
    name: '',
    location: '',
    totalCapacity: '',
    services: [] as string[]
  })

  const fetchCamps = async () => {
    try {
      setLoading(true)
      const res = await campService.getCamps()
      setCamps(res.data)
    } catch (err) {
      console.error('Failed to fetch camps', err)
      alert('Failed to load camps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCamps()
  }, [])

  const handleAddCamp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await campService.createCamp(newCamp)
      alert('Relief camp added successfully')
      setShowModal(false)
      setNewCamp({ name: '', location: '', totalCapacity: '', services: [] })
      fetchCamps()
    } catch (error) {
      console.error('Failed to add camp:', error)
      alert('Failed to add camp')
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
    ? Math.round(camps.reduce((acc, c) => acc + ((c.currentOccupancy / c.totalCapacity) * 100), 0) / camps.length) 
    : 0

  const stats = [
    { label: 'Active Camps', value: camps.length.toString(), color: 'text-blue-600' },
    { label: 'People Sheltered', value: totalPeople.toLocaleString(), color: 'text-green-600' },
    { label: 'Avg Occupancy', value: `${avgOccupancy}%`, color: 'text-orange-600' },
    { label: 'Near Capacity', value: camps.filter(c => (c.currentOccupancy / c.totalCapacity) > 0.9).length.toString(), color: 'text-red-600' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">{t('camps.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('camps.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="suraksha-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('camps.new_camp')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="suraksha-card p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all">
             <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Camps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading camps...</p>
          </div>
        ) : camps.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.location.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
           <div className="lg:col-span-2 text-center py-24 bg-white rounded-[1.5rem] border border-dashed border-slate-200">
             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-slate-300" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest mb-1">{searchQuery ? 'No matching camps' : 'No Relief Camps Registered'}</p>
             <p className="text-slate-400 text-sm">{searchQuery ? `No results for "${searchQuery}"` : 'Add your first camp to start management'}</p>
           </div>
        ) : (
          camps
            .filter(c => 
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              c.location.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((camp, idx) => {
            const percent = Math.round((camp.currentOccupancy / camp.totalCapacity) * 100)
            const status = percent > 90 ? 'HIGH' : percent > 60 ? 'MODERATE' : 'LOW'
            const statusColor = status === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                              status === 'MODERATE' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              'bg-green-50 text-green-600 border-green-100'
            const barColor = status === 'HIGH' ? 'bg-red-500' :
                           status === 'MODERATE' ? 'bg-yellow-500' :
                           'bg-green-500'

            return (
              <div key={idx} className="suraksha-card p-7 flex flex-col space-y-6 hover:shadow-lg transition-all relative group rounded-[1.5rem]">
                {/* Severity Pill */}
                <div className="absolute top-7 right-7">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase border",
                    statusColor
                  )}>
                    {status}
                  </span>
                </div>

                {/* Camp Name & Location */}
                <div className="pr-20">
                  <h3 className="text-xl font-black text-[#1e293b]">{camp.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 font-bold mt-1">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    {camp.location}
                  </div>
                </div>

                {/* Occupancy Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[13px] font-bold text-slate-400">Occupancy</span>
                    <span className="text-sm font-bold text-[#1e293b]">{camp.currentOccupancy}/{camp.totalCapacity} ({percent}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: `${percent}%` }} />
                  </div>
                </div>

                {/* Services List */}
                <div className="space-y-3">
                  <span className="text-[13px] font-bold text-slate-400">Available Services</span>
                  <div className="flex flex-wrap gap-2">
                    {camp.services && camp.services.length > 0 ? camp.services.map((sName: string) => {
                      const s = servicesList.find(t => t.name === sName);
                      if (!s) return null;
                      return (
                        <div key={sName} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100">
                          <s.icon className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold lowercase">{sName}</span>
                        </div>
                      );
                    }) : (
                      <span className="text-xs text-slate-300 italic">No services listed</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-bold">Wait time: <span className="text-[#1e293b] font-extrabold">{camp.waitTime || 'N/A'}</span></span>
                  </div>
                  <button 
                    onClick={() => setSelectedCamp(camp)}
                    className="text-sm font-bold text-[#0061ff] hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Camp Details Modal */}
      {selectedCamp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Left Info Panel */}
            <div className="p-8 md:w-1/2 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1e293b] leading-tight">{selectedCamp.name}</h2>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400 font-bold mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedCamp.location}
                  </div>
                </div>
                <button onClick={() => setSelectedCamp(null)} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Occupancy */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Occupancy</span>
                    <span className="text-xl font-black text-[#1e293b]">{selectedCamp.currentOccupancy} <span className="text-sm text-slate-400">/ {selectedCamp.totalCapacity}</span></span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", 
                        (selectedCamp.currentOccupancy / selectedCamp.totalCapacity) > 0.9 ? 'bg-red-500' : 
                        (selectedCamp.currentOccupancy / selectedCamp.totalCapacity) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      )} 
                      style={{ width: `${Math.round((selectedCamp.currentOccupancy / selectedCamp.totalCapacity) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Services */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Available Services</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCamp.services && selectedCamp.services.length > 0 ? selectedCamp.services.map((sName: string) => {
                      const s = servicesList.find(t => t.name === sName);
                      if (!s) return null;
                      return (
                        <div key={sName} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                          <s.icon className="w-4 h-4" />
                          <span className="text-xs font-bold capitalize">{sName}</span>
                        </div>
                      );
                    }) : (
                      <span className="text-xs text-slate-400 italic">No specific services listed</span>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <div className="flex justify-between items-center text-sm font-bold">
                     <span className="text-slate-400">Status</span>
                     <span className="text-[#1e293b] bg-slate-100 px-2 py-0.5 rounded">{selectedCamp.status || 'OPEN'}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm font-bold">
                     <span className="text-slate-400">Est. Wait Time</span>
                     <span className="text-[#1e293b]">{selectedCamp.waitTime || 'N/A'}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Map Panel */}
            <div className="md:w-1/2 h-64 md:h-auto bg-slate-100 relative min-h-[300px]">
              <button onClick={() => setSelectedCamp(null)} className="hidden md:flex absolute top-4 right-4 z-[2000] bg-white/90 backdrop-blur shadow-xl w-10 h-10 rounded-full items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
              </button>
              {selectedCamp.latitude && selectedCamp.longitude ? (
                <MapContainer
                  center={[selectedCamp.latitude, selectedCamp.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={[selectedCamp.latitude, selectedCamp.longitude]} icon={createCampIcon()}>
                     <Popup className="suraksha-popup" minWidth={200}>
                        <div className="font-sans">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Safety Hub</span>
                          </div>
                          <h4 className="font-black text-slate-900 text-sm">{selectedCamp.name}</h4>
                        </div>
                     </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 border-l border-slate-100">
                  <MapPin className="w-12 h-12 mb-4 opacity-50" />
                  <span className="text-sm font-bold">GPS Coordinates Unavailable</span>
                  <span className="text-[10px] uppercase tracking-widest mt-2">Location mapping disabled for this camp</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add Camp Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-[#1e293b]">Add New Resource</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddCamp} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Camp Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mahamaya College Relief Camp" 
                    required
                    className="suraksha-input"
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="Enter area name" 
                    required
                    className="suraksha-input"
                    value={newCamp.location}
                    onChange={(e) => setNewCamp({...newCamp, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Total Capacity</label>
                  <input 
                    type="number" 
                    placeholder="Max people count" 
                    required
                    className="suraksha-input"
                    value={newCamp.totalCapacity}
                    onChange={(e) => setNewCamp({...newCamp, totalCapacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Services Available</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {servicesList.map((service) => (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => toggleService(service.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all space-y-2",
                        newCamp.services.includes(service.name)
                          ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <service.icon className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{service.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-[#0061ff] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Camp'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
