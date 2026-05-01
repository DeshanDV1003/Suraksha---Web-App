import { useState, useEffect } from 'react'
import { Package, Eye, Phone, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'

interface Resource {
  id: string
  type: string
  owner: string
  location: string
  capacity: string
  status: string
  contact: string
}

export default function ResourcesPage() {
  const { searchQuery } = useAppStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newResource, setNewResource] = useState({
    type: '',
    owner: '',
    location: '',
    capacity: '',
    contact: '',
  })

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const response = await resourceService.getResources()
      setResources(response.data)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      alert('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await resourceService.createResource(newResource)
      alert('Resource added successfully')
      setShowModal(false)
      setNewResource({ type: '', owner: '', location: '', capacity: '', contact: '' })
      fetchResources()
    } catch (error) {
      console.error('Failed to add resource:', error)
      alert('Failed to add resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    { 
      label: 'Boats Available', 
      value: resources.filter(r => r.type.toLowerCase().includes('boat') && r.status === 'AVAILABLE').length, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Vehicles', 
      value: resources.filter(r => r.type.toLowerCase().includes('vehicle') || r.type.toLowerCase().includes('truck')).length, 
      color: 'text-green-600' 
    },
    { 
      label: 'Generators', 
      value: resources.filter(r => r.type.toLowerCase().includes('generator')).length, 
      color: 'text-purple-600' 
    },
    { 
      label: 'Shelter Rooms', 
      value: resources.filter(r => r.type.toLowerCase().includes('room') || r.type.toLowerCase().includes('shelter')).length, 
      color: 'text-orange-600' 
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1e293b]">Community Resource Management</h1>
          <p className="text-slate-500 mt-1 font-bold">Crowdsourced resources from local community</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="suraksha-card p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Resources Table */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Resource Type</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Owner</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Location</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Capacity</th>
                <th className="px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Contact</th>
                <th className="px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-slate-400 font-medium">Loading resources...</p>
                    </div>
                  </td>
                </tr>
              ) : resources.filter(r => 
                r.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.location.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-medium">
                    {searchQuery ? `No matching resources found for "${searchQuery}"` : 'No resources found. Add one to get started!'}
                  </td>
                </tr>
              ) : (
                resources
                  .filter(r => 
                    r.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.location.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((resource) => (
                  <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#0061ff] transition-colors whitespace-nowrap">{resource.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-semibold text-slate-400">{resource.owner}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.location}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.capacity}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap inline-block uppercase",
                        resource.status === 'AVAILABLE' ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.contact}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-5">
                        <button 
                          onClick={() => alert(`Resource Details:\nType: ${resource.type}\nOwner: ${resource.owner}\nLocation: ${resource.location}\nCapacity: ${resource.capacity}\nContact: ${resource.contact}`)}
                          className="text-blue-500 hover:scale-110 transition-transform" 
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <a 
                          href={`tel:${resource.contact}`}
                          className="text-[#00AEEF] hover:scale-110 transition-transform" 
                          title="Call owner"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-[#1e293b]">Add New Resource</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddResource} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Resource Type</label>
                <input 
                  type="text" 
                  placeholder="e.g. Boat, Pickup Truck, Generator" 
                  required
                  className="suraksha-input"
                  value={newResource.type}
                  onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Owner Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter full name" 
                    required
                    className="suraksha-input"
                    value={newResource.owner}
                    onChange={(e) => setNewResource({...newResource, owner: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Colombo 7" 
                    required
                    className="suraksha-input"
                    value={newResource.location}
                    onChange={(e) => setNewResource({...newResource, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Capacity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 6 people, 5kW" 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={newResource.capacity}
                    onChange={(e) => setNewResource({...newResource, capacity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +94 ..." 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={newResource.contact}
                    onChange={(e) => setNewResource({...newResource, contact: e.target.value})}
                  />
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
                  className="flex-1 px-6 py-4 bg-[#0061ff] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Resource'
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
