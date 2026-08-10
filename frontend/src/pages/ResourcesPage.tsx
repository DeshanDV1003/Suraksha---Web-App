import { useState, useEffect } from 'react'
import { Package, Eye, Phone, Plus, X, Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

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
  const { t } = useTranslation()
  const { searchQuery } = useAppStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [contactModal, setContactModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCopyContact = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      showToast('Phone number copied to clipboard', 'success')
      setContactModal(null)
    } catch(e) {
      showToast('Failed to copy', 'error')
    }
  }
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
      showToast('Failed to load resources', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await resourceService.createResource(newResource)
      showToast('Resource added successfully')
      setShowModal(false)
      setNewResource({ type: '', owner: '', location: '', capacity: '', contact: '' })
      fetchResources()
    } catch (error) {
      console.error('Failed to add resource:', error)
      showToast('Failed to add resource', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    {
      label: t('resources_page.total_resources'),
      value: resources.length,
      color: 'text-blue-400'
    },
    {
      label: t('resources_page.available'),
      value: resources.filter(r => r.status === 'AVAILABLE').length,
      color: 'text-green-400'
    },
    {
      label: t('resources_page.in_use'),
      value: resources.filter(r => r.status === 'IN_USE').length,
      color: 'text-purple-400'
    },
    {
      label: t('resources_page.maintenance'),
      value: resources.filter(r => r.status === 'MAINTENANCE').length,
      color: 'text-orange-400'
    },
  ]

  return (
        <>
          <PageMeta title={`${t('nav.resources')} | Suraksha`} description="Suraksha Resources Page" />
          <PageBreadcrumb pageTitle={t('nav.resources')} />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('resources_page.add_resource')}
          </button>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="suraksha-card p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
               <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
               <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Resources Table */}
        <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 rounded-[1.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0e1d36] border-b border-slate-200 dark:border-white/10">
                  <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.resource_type')}</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.owner')}</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.location')}</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.capacity')}</th>
                  <th className="px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.status')}</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.contact')}</th>
                  <th className="px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-gray-400">{t('resources_page.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-gray-400 dark:text-gray-500 font-medium">{t('resources_page.loading')}</p>
                      </div>
                    </td>
                  </tr>
                ) : resources.filter(r => 
                  r.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.location.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 dark:text-gray-500 font-medium">
                      {searchQuery ? `${t('resources_page.no_matching')} "${searchQuery}"` : t('resources_page.no_resources')}
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
                    <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors whitespace-nowrap">{resource.type}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{resource.owner}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{resource.location}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{resource.capacity}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap inline-block uppercase",
                          resource.status === 'AVAILABLE' ? "bg-green-50 text-green-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        )}>
                          {resource.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{resource.contact}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-5">
                          <button 
                            onClick={() => setSelectedResource(resource)}
                            className="text-blue-500 hover:scale-110 transition-transform" 
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setContactModal(resource.contact)}
                            className="text-[#00AEEF] hover:scale-110 transition-transform" 
                            title="Contact options"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
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
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#131f33] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#0e1d36]">
                <h2 className="text-xl font-black text-slate-800 dark:text-white/90">{t('resources_page.add_new_resource')}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddResource} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('resources_page.resource_type')}</label>
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
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('resources_page.owner_name')}</label>
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
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('resources_page.location')}</label>
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
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('resources_page.capacity')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 6 people, 5kW" 
                      required
                      className="suraksha-input"
                      value={newResource.capacity}
                      onChange={(e) => setNewResource({...newResource, capacity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('resources_page.contact_number')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +94 ..." 
                      required
                      className="suraksha-input"
                      value={newResource.contact}
                      onChange={(e) => setNewResource({...newResource, contact: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/15 transition-all"
                  >
                    {t('resources_page.cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 bg-brand-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('resources_page.creating')}
                      </>
                    ) : (
                      t('resources_page.create_resource')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedResource && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-cyan-400/10 flex items-center justify-between bg-slate-50 dark:bg-[#131f33]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('resources_page.resource_info')}</h2>
                    <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400/70 uppercase tracking-widest mt-0.5">{selectedResource.status}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedResource(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: t('resources_page.type'), value: selectedResource.type },
                  { label: t('resources_page.owner'), value: selectedResource.owner },
                  { label: t('resources_page.location'), value: selectedResource.location },
                  { label: t('resources_page.capacity'), value: selectedResource.capacity },
                  { label: t('resources_page.contact'), value: selectedResource.contact },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-black text-slate-400 dark:text-cyan-400/70 uppercase tracking-widest">{item.label}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setContactModal(selectedResource.contact)}
                  className="flex-1 bg-[#00AEEF] hover:bg-[#009bd6] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <Phone className="w-4 h-4" />
                  {t('resources_page.contact_options')}
                </button>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  {t('resources_page.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {contactModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-brand-500">
                  <Phone className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-2">{t('resources_page.contact_resource')}</h3>
                  <p className="text-2xl font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-3 rounded-xl">{contactModal}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => handleCopyContact(contactModal)}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-slate-700 rounded-2xl font-bold transition-all"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="text-xs">{t('resources_page.copy')}</span>
                  </button>
                  <a 
                    href={`tel:${contactModal}`}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-[#00AEEF] hover:bg-[#009bd6] text-white rounded-2xl font-bold transition-all shadow-lg shadow-cyan-500/25"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="text-xs">{t('resources_page.dial')}</span>
                  </a>
                </div>
                <button 
                  onClick={() => setContactModal(null)}
                  className="w-full py-3 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {t('resources_page.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
        </>
      )
}
