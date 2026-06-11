import { useEffect, useState } from 'react'
import { 
  Building2, Users, PieChart, AlertTriangle, 
  Utensils, Droplets, Heart, Zap, Bath, 
  UserCheck, Baby, Accessibility, Clock, MapPin, Plus, X, Loader2, ListTodo, Stethoscope, ArrowRightLeft, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { campService } from '../services/api'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

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
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null)
  
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
      setShowModal(false)
      setNewCamp({ name: '', location: '', totalCapacity: '', services: [] })
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
    ? Math.round(camps.reduce((acc, c) => acc + ((c.currentOccupancy / c.totalCapacity) * 100), 0) / camps.length) 
    : 0

  const stats = [
    { label: 'Active Camps', value: camps.length.toString(), color: 'text-blue-600' },
    { label: 'People Sheltered', value: totalPeople.toLocaleString(), color: 'text-green-600' },
    { label: 'Avg Occupancy', value: `${avgOccupancy}%`, color: 'text-orange-600' },
    { label: 'Near Capacity', value: camps.filter(c => (c.currentOccupancy / c.totalCapacity) > 0.9).length.toString(), color: 'text-red-600' },
  ]

  return (
        <>
          <PageMeta title="Camps | Suraksha" description="Suraksha Camps Page" />
          <PageBreadcrumb pageTitle="Camps" />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowModal(true)}
            className="suraksha-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('camps.new_camp')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="suraksha-card p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all">
               <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
               <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">Loading camps...</p>
            </div>
          ) : camps.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
             <div className="lg:col-span-2 text-center py-24 bg-white dark:bg-gray-900 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-gray-700">
               <div className="bg-gray-50 dark:bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-slate-300" />
               </div>
               <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">{searchQuery ? 'No matching camps' : 'No Relief Camps Registered'}</p>
             </div>
          ) : (
            camps.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase())).map((camp, idx) => {
              const percent = Math.round((camp.currentOccupancy / camp.totalCapacity) * 100)
              const status = percent >= 80 ? 'HIGH' : percent > 50 ? 'MODERATE' : 'LOW'
              const statusColor = status === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : status === 'MODERATE' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-green-50 text-green-600 border-green-100'
              const barColor = status === 'HIGH' ? 'bg-red-500' : status === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'

              return (
                <div key={idx} className="suraksha-card p-7 flex flex-col space-y-6 hover:shadow-lg transition-all relative group rounded-[1.5rem]">
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
                      <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500">Occupancy</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">{camp.currentOccupancy}/{camp.totalCapacity} ({percent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500">Available Services</span>
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
                      }) : <span className="text-xs text-slate-300 italic">No services listed</span>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold">Wait time: <span className="text-gray-800 dark:text-white/90 font-extrabold">{camp.waitTime || 'N/A'}</span></span>
                    </div>
                    <button onClick={() => setSelectedCampId(camp.id)} className="text-sm font-bold text-brand-500 hover:underline">
                      Manage Camp
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {selectedCampId && <CampDetailsModal campId={selectedCampId} onClose={() => { setSelectedCampId(null); fetchCamps(); }} />}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50/50">
                <h2 className="text-xl font-black text-gray-800 dark:text-white/90">Add New Resource</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddCamp} className="p-8 space-y-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Camp Name</label>
                     <input required className="suraksha-input" value={newCamp.name} onChange={(e) => setNewCamp({...newCamp, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Location</label>
                     <input required className="suraksha-input" value={newCamp.location} onChange={(e) => setNewCamp({...newCamp, location: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Total Capacity</label>
                     <input required type="number" className="suraksha-input" value={newCamp.totalCapacity} onChange={(e) => setNewCamp({...newCamp, totalCapacity: e.target.value})} />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Services Available</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {servicesList.map((service) => (
                       <button key={service.name} type="button" onClick={() => toggleService(service.name)} className={cn("flex flex-col items-center justify-center p-4 rounded-2xl border transition-all space-y-2", newCamp.services.includes(service.name) ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-slate-300")}>
                         <service.icon className="w-6 h-6" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">{service.name}</span>
                       </button>
                     ))}
                   </div>
                 </div>
                 <div className="pt-4 flex gap-4">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:bg-gray-700 transition-all">Cancel</button>
                   <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-4 bg-brand-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25">Create Camp</button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
        </>
      )
}

function CampDetailsModal({ campId, onClose }: { campId: string, onClose: () => void }) {
  const [camp, setCamp] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESIDENTS' | 'INVENTORY' | 'SCHEDULE' | 'REFERRALS'>('OVERVIEW')

  const fetchCamp = async () => {
    const res = await campService.getCampById(campId)
    setCamp(res.data)
  }

  const [showTransferModal, setShowTransferModal] = useState(false)
  
  useEffect(() => {
    fetchCamp()
  }, [campId])

  if (!camp) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </div>
  )

  const occupancyRate = camp.currentOccupancy / camp.totalCapacity
  const isSurging = occupancyRate >= 0.8

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-[1.5rem] shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white/90 flex items-center gap-3">
              {camp.name}
              {isSurging && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Surge Active</span>}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {camp.location}</p>
          </div>
          <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full hover:bg-gray-200 dark:bg-gray-700"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-8 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Overview & Map', icon: Building2 },
            { id: 'RESIDENTS', label: 'Digital Roll', icon: Users },
            { id: 'INVENTORY', label: 'Supply Inventory', icon: PieChart },
            { id: 'SCHEDULE', label: 'Services Schedule', icon: ListTodo },
            { id: 'REFERRALS', label: 'Hospital Referrals', icon: Stethoscope },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn("flex items-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 whitespace-nowrap", activeTab === t.id ? "border-brand-500 text-brand-500" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300")}
            >
              <t.icon className="w-4 h-4"/> {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-800/50/50">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {isSurging && (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-red-700 font-black text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Capacity Surge Alert</h4>
                    <p className="text-red-600 text-sm mt-1">This camp is at {Math.round(occupancyRate * 100)}% capacity. Recommend immediate inter-camp transfers.</p>
                  </div>
                  <button onClick={() => setShowTransferModal(true)} className="bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">Initiate Transfer Workflow</button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="suraksha-card p-6 bg-white dark:bg-gray-900 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Current Occupancy</h4>
                    <div className="text-3xl font-black text-gray-800 dark:text-white/90">{camp.currentOccupancy} <span className="text-lg text-gray-400 dark:text-gray-500">/ {camp.totalCapacity}</span></div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
                      <div className={cn("h-full rounded-full", isSurging ? 'bg-red-500' : 'bg-green-500')} style={{width: `${Math.round(occupancyRate * 100)}%`}} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Transfers</h4>
                    <div className="flex gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex-1 text-center">
                        <div className="text-2xl font-black text-blue-600">{camp.transfersIn?.length || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Pending Inbound</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex-1 text-center">
                        <div className="text-2xl font-black text-orange-600">{camp.transfersOut?.length || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Pending Outbound</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="suraksha-card overflow-hidden h-64 lg:h-auto bg-gray-100 dark:bg-gray-800 relative min-h-[300px]">
                  {camp.latitude && camp.longitude ? (
                    <MapContainer center={[camp.latitude, camp.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={[camp.latitude, camp.longitude]} icon={createCampIcon()} />
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <MapPin className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-sm font-bold">GPS Coordinates Unavailable</span>
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
  const [name, setName] = useState('')
  const [nic, setNic] = useState('')
  
  const handleAdd = async (e: any) => {
    e.preventDefault()
    try {
      const res = await campService.addResident(campId, { name, nic })
      if (res.data.isMissingPersonMatch) {
         alert('CRITICAL: This resident matched a Missing Person report! Authorities have been notified.')
      }
      setName('')
      setNic('')
      refresh()
    } catch (e) {
      alert('Failed to register resident')
    }
  }

  const handleCheckout = async (id: string) => {
    await campService.checkoutResident(id)
    refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-gray-900 flex flex-col md:flex-row items-end gap-4 shadow-sm border-blue-100">
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Name</label>
           <input required className="suraksha-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Resident Name" />
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">NIC (Optional)</label>
           <input className="suraksha-input" value={nic} onChange={e=>setNic(e.target.value)} placeholder="ID Number" />
         </div>
         <button type="submit" className="suraksha-button h-12 px-8 w-full md:w-auto">Register Resident</button>
      </form>
      <div className="suraksha-card bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Name</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">NIC</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Check-In</th>
              <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {residents.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-bold flex items-center gap-2">
                  {r.name}
                </td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{r.nic || '-'}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(r.checkInTime).toLocaleString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleCheckout(r.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors">Checkout</button>
                </td>
              </tr>
            ))}
            {residents.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500 italic font-bold">No active residents in digital roll.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventoryTab({ campId, inventory, refresh }: any) {
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
         const color = status === 'GREEN' ? 'text-green-600 bg-green-50 border-green-200' : status === 'AMBER' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-red-600 bg-red-50 border-red-200'
         
         return (
           <div key={type} className={cn("suraksha-card p-6 border-2 transition-colors", color)}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-sm uppercase tracking-widest">{type}</span>
                <span className={cn("w-3 h-3 rounded-full shadow-inner", status === 'GREEN' ? 'bg-green-500' : status === 'AMBER' ? 'bg-yellow-500' : 'bg-red-500')} />
              </div>
              <div className="text-3xl font-black mb-1">{inv.quantity} <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Units</span></div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-6">Threshold: {inv.threshold}</div>
              
              <div className="flex gap-2">
                <button onClick={() => handleUpdate(type, (inv.quantity + 50).toString())} className="flex-1 bg-white dark:bg-gray-900/50 hover:bg-white dark:bg-gray-900 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm">+50</button>
                <button onClick={() => handleUpdate(type, Math.max(0, inv.quantity - 10).toString())} className="flex-1 bg-white dark:bg-gray-900/50 hover:bg-white dark:bg-gray-900 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm">-10</button>
              </div>
           </div>
         )
       })}
    </div>
  )
}

function ScheduleTab({ campId, schedules, refresh }: any) {
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
         <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-gray-900 space-y-4 shadow-sm">
           <h3 className="font-black uppercase tracking-widest text-sm mb-4">Add Schedule Entry</h3>
           <input required className="suraksha-input" placeholder="Activity Name" value={form.activityName} onChange={e=>setForm({...form, activityName: e.target.value})} />
           <div className="flex gap-2">
             <input required type="time" className="suraksha-input" value={form.startTime} onChange={e=>setForm({...form, startTime: e.target.value})} />
             <input required type="time" className="suraksha-input" value={form.endTime} onChange={e=>setForm({...form, endTime: e.target.value})} />
           </div>
           <select className="suraksha-input" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
             <option value="MEAL">Meal Time</option>
             <option value="MEDICAL">Medical Clinic</option>
             <option value="COUNSELING">Counseling</option>
             <option value="ACTIVITY">General Activity</option>
           </select>
           <button type="submit" className="suraksha-button w-full">Publish to QR Board</button>
         </form>
       </div>
       <div className="lg:col-span-2">
         <div className="suraksha-card bg-white dark:bg-gray-900 shadow-sm p-6 space-y-4">
           {schedules.map((s: any) => (
             <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">{s.startTime}</div>
                 <div>
                   <h4 className="font-black text-sm">{s.activityName}</h4>
                   <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{s.type} • Till {s.endTime}</span>
                 </div>
               </div>
               <button onClick={() => handleDelete(s.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500"><X className="w-5 h-5"/></button>
             </div>
           ))}
           {schedules.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 italic text-sm font-bold py-10">No schedules posted for today.</p>}
         </div>
       </div>
    </div>
  )
}

function ReferralsTab({ campId, referrals, refresh }: any) {
  const [form, setForm] = useState({ patientName: '', hospitalAssigned: '', conditionSeverity: 'MEDIUM' })
  
  const handleAdd = async (e: any) => {
    e.preventDefault()
    await campService.addReferral(campId, form)
    setForm({ patientName: '', hospitalAssigned: '', conditionSeverity: 'MEDIUM' })
    refresh()
  }

  const handleUpdate = async (id: string, status: string) => {
    await campService.updateReferral(id, status)
    refresh()
  }

  return (
    <div className="space-y-6">
       <form onSubmit={handleAdd} className="suraksha-card p-6 bg-white dark:bg-gray-900 flex flex-col md:flex-row items-end gap-4 shadow-sm border-blue-100">
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Patient Name</label>
           <input required className="suraksha-input" value={form.patientName} onChange={e=>setForm({...form, patientName: e.target.value})} placeholder="Name" />
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Hospital</label>
           <input required className="suraksha-input" value={form.hospitalAssigned} onChange={e=>setForm({...form, hospitalAssigned: e.target.value})} placeholder="e.g. General Hospital" />
         </div>
         <div className="flex-1 w-full space-y-1">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Severity</label>
           <select className="suraksha-input" value={form.conditionSeverity} onChange={e=>setForm({...form, conditionSeverity: e.target.value})}>
             <option value="LOW">Low</option>
             <option value="MEDIUM">Medium</option>
             <option value="HIGH">High</option>
             <option value="CRITICAL">Critical</option>
           </select>
         </div>
         <button type="submit" className="suraksha-button h-12 px-8 w-full md:w-auto">Log Referral</button>
      </form>

      <div className="suraksha-card bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Patient</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Hospital</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Severity</th>
              <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {referrals.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-bold">{r.patientName}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{r.hospitalAssigned}</td>
                <td className="p-4">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest", r.conditionSeverity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300')}>{r.conditionSeverity}</span>
                </td>
                <td className="p-4">
                   <select 
                     className="text-xs font-bold bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                     value={r.status}
                     onChange={(e) => handleUpdate(r.id, e.target.value)}
                   >
                     <option value="PENDING">Pending</option>
                     <option value="IN_TRANSIT">In Transit</option>
                     <option value="ADMITTED">Admitted</option>
                     <option value="DISCHARGED">Discharged</option>
                   </select>
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500 italic font-bold">No hospital referrals logged.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransferModal({ fromCamp, onClose, refresh }: any) {
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
      alert('Transfer Request Submitted to HQ.')
      onClose()
      refresh()
    } catch(e) {
      alert('Failed to submit transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[1.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-black text-gray-800 dark:text-white/90 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5"/> Transfer Request</h3>
           <button onClick={onClose}><X className="w-5 h-5 text-gray-400 dark:text-gray-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Destination Camp</label>
             <select required className="suraksha-input" value={toCampId} onChange={e=>setToCampId(e.target.value)}>
               <option value="">Select an available camp...</option>
               {camps.map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.totalCapacity - c.currentOccupancy} spots available)</option>
               ))}
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Number of People</label>
             <input required type="number" max={fromCamp.currentOccupancy} className="suraksha-input" value={peopleCount} onChange={e=>setPeopleCount(e.target.value)} placeholder="0" />
           </div>
           <div className="pt-4 flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl py-3 font-bold text-sm">Cancel</button>
             <button type="submit" disabled={loading || !toCampId} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-bold text-sm">Submit Request</button>
           </div>
        </form>
      </div>
    </div>
  )
}
