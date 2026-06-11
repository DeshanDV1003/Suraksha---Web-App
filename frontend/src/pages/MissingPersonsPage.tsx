import { useState, useEffect } from 'react'
import { UserSearch, Plus, X, MapPin, Clock, Loader2, User, Phone, BrainCircuit, Activity, Users, ShieldAlert, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { missingPersonService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function MissingPersonsPage() {
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  
  const [activeTab, setActiveTab] = useState('active') // active, unidentified, cross-reference, ai

  // AI & Cross Ref State
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<any[]>([])
  const [crossRefLoading, setCrossRefLoading] = useState(false)
  const [crossRefMatches, setCrossRefMatches] = useState<any[]>([])

  const [reunificationNotes, setReunificationNotes] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSelectedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await missingPersonService.getMissing()
      setPersons(res.data)
    } catch (error) {
      console.error('Failed to fetch missing persons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'active' || activeTab === 'unidentified') fetchData()
  }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      name: formData.get('name'),
      age: parseInt(formData.get('age') as string) || null,
      gender: formData.get('gender'),
      description: formData.get('description'),
      lastSeen: formData.get('lastSeen'),
      contactName: formData.get('contactName'),
      contactPhone: formData.get('contactPhone'),
      isUnidentified: formData.get('isUnidentified') === 'true',
      photo: selectedImage || ''
    }

    try {
      setIsSubmitting(true)
      await missingPersonService.reportMissing(data)
      setShowModal(false)
      setSelectedImage(null)
      fetchData()
    } catch (error) {
      console.error(error)
      alert('Failed to report missing person')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAiSearch = async () => {
    if (!selectedImage) return alert('Upload a photo first')
    setAiLoading(true)
    try {
      const res = await missingPersonService.searchFace('mock_url')
      setAiMatches(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setAiLoading(false)
    }
  }

  const handleCrossReference = async () => {
    setCrossRefLoading(true)
    try {
      const res = await missingPersonService.runCrossReference()
      setCrossRefMatches(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setCrossRefLoading(false)
    }
  }

  const handleReunify = async (status: string) => {
    try {
      await missingPersonService.triggerReunification(selectedPerson.id, status, reunificationNotes)
      setReunificationNotes('')
      setSelectedPerson(null)
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const displayedPersons = activeTab === 'unidentified' 
    ? persons.filter(p => p.isUnidentified) 
    : persons.filter(p => !p.isUnidentified)

  return (
        <>
          <PageMeta title="Missing Persons | Suraksha" description="Suraksha Missing Persons Page" />
          <PageBreadcrumb pageTitle="Missing Persons" />
          <div className="space-y-8 animate-in fade-in duration-700 pb-10 w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-2">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            File New Report
          </button>
        </div>

        <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <button onClick={() => setActiveTab('active')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'active' ? "bg-red-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50")}>
            <Users className="w-4 h-4" /> Active Cases
          </button>
          <button onClick={() => setActiveTab('unidentified')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'unidentified' ? "bg-red-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50")}>
            <ShieldAlert className="w-4 h-4" /> Unidentified Registry
          </button>
          <button onClick={() => { setActiveTab('cross-reference'); handleCrossReference(); }} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'cross-reference' ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50")}>
            <Activity className="w-4 h-4" /> Cross-Reference Engine
          </button>
          <button onClick={() => { setActiveTab('ai'); setAiMatches([]); setSelectedImage(null); }} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'ai' ? "bg-purple-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50")}>
            <BrainCircuit className="w-4 h-4" /> AI Face Matcher
          </button>
        </div>

        {/* ACTIVE & UNIDENTIFIED TABS */}
        {(activeTab === 'active' || activeTab === 'unidentified') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
              </div>
            ) : displayedPersons.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-[2.5rem] p-20 text-center space-y-4">
                <UserSearch className="w-16 h-16 text-slate-200 mx-auto" />
                <h3 className="text-xl font-bold text-slate-700">No Records Found</h3>
              </div>
            ) : (
              displayedPersons.map((person) => (
                <div key={person.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-red-500/5 transition-all overflow-hidden">
                  <div className="relative h-64 -mx-6 -mt-6 mb-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden">
                      {person.photo ? (
                        <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <User className="w-20 h-20 text-slate-200" />
                      )}
                      {person.status === 'FOUND' && (
                        <div className="absolute top-4 right-4 z-20 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Found</div>
                      )}
                      {person.reunificationStatus === 'IN_PROGRESS' && (
                        <div className="absolute top-4 left-4 z-20 bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Reunifying</div>
                      )}
                  </div>

                  <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{person.name}</h3>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{person.age ? `${person.age} Years Old` : 'Age Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold">
                        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="truncate">Last seen: {person.lastSeen}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <button onClick={() => setSelectedPerson(person)} className="text-xs font-black text-red-500 uppercase hover:underline">View File</button>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CROSS REFERENCE TAB */}
        {activeTab === 'cross-reference' && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Automated Cross-Reference Engine</h2>
                
              </div>
              <button onClick={handleCrossReference} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Run Scan Now
              </button>
            </div>

            {crossRefLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : crossRefMatches.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl"><p className="text-gray-400 dark:text-gray-500 font-bold">No potential matches found at this time.</p></div>
            ) : (
              <div className="grid gap-4">
                {crossRefMatches.map((match, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-3xl items-center">
                    <div className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-red-100 shadow-sm">
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Missing Person</div>
                      <div className="font-black text-slate-800 text-lg">{match.missingPerson.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{match.missingPerson.age} yrs • {match.missingPerson.gender}</div>
                    </div>
                    <div className="w-full md:w-32 text-center">
                      <div className="text-3xl font-black text-blue-600">{match.matchScore}%</div>
                      <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Match Prob.</div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Found in {match.matchedRecord.type.replace('_', ' ')}</div>
                      <div className="font-black text-slate-800 text-lg">{match.matchedRecord.data.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{match.matchedRecord.data.age} yrs • {match.matchedRecord.data.gender}</div>
                    </div>
                    <button onClick={() => setSelectedPerson(match.missingPerson)} className="bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-800">
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI FACE MATCHER TAB */}
        {activeTab === 'ai' && (
          <div className="flex flex-col md:flex-row gap-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="w-full md:w-1/3 bg-purple-50 p-8 rounded-3xl border border-purple-100 text-center flex flex-col items-center">
              <BrainCircuit className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-black text-purple-900 mb-2">AI Face Scanner</h3>
              <p className="text-sm text-purple-700/70 mb-8">Upload a photo of an unidentified found individual to cross-reference against the missing persons database.</p>
              
              <div className="relative w-full aspect-square bg-white dark:bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors cursor-pointer group mb-6">
                {selectedImage ? (
                  <img src={selectedImage} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-purple-300 group-hover:text-purple-500 mb-2" />
                    <span className="font-bold text-purple-400 text-sm">Select Image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <button onClick={handleAiSearch} disabled={aiLoading || !selectedImage} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Scan"}
              </button>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-800 mb-6">Potential Matches</h3>
              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-purple-600 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Running Neural Network Analysis...</span>
                </div>
              ) : aiMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiMatches.map((match, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-md cursor-pointer transition-shadow" onClick={() => setSelectedPerson(match.person)}>
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0">
                        {match.person.photo ? <img src={match.person.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-400 dark:text-gray-500" />}
                      </div>
                      <div>
                        <div className="font-black text-slate-800">{match.person.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.person.age} yrs • {match.person.gender}</div>
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" /> {(match.confidence * 100).toFixed(1)}% Match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-400 dark:text-gray-500 font-bold">Upload an image to see AI matches.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50/50 shrink-0">
                <h2 className="text-2xl font-black text-slate-900">File Report</h2>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6 flex-1">
                
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="isUnidentified" value="true" className="w-5 h-5 text-red-600 rounded border-slate-300" />
                    <span className="font-bold text-red-900">Register as Unidentified Found Person instead</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Name / Alias</label>
                    <input name="name" type="text" required className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Age</label>
                    <input name="age" type="number" className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Gender</label>
                    <select name="gender" className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Last Seen Location / Found Location</label>
                    <input name="lastSeen" type="text" required className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Description</label>
                  <textarea name="description" rows={3} required className="suraksha-input resize-none focus:ring-red-500/20 focus:border-red-500/40"></textarea>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Photo</label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                      {selectedImage ? <img src={selectedImage} className="w-full h-full object-cover" /> : <Plus className="text-gray-400 dark:text-gray-500" />}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Upload a clear photo to enable AI matching.</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                  <h4 className="font-bold text-slate-800 mb-4">Family Contact (For Reunification)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Contact Name</label>
                      <input name="contactName" type="text" className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Contact Phone</label>
                      <input name="contactPhone" type="tel" className="suraksha-input focus:ring-red-500/20 focus:border-red-500/40" />
                    </div>
                  </div>
                </div>

                <button disabled={isSubmitting} className="w-full py-5 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 mt-6 hover:bg-red-700">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Save Record"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Details & Reunification Modal */}
        {selectedPerson && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[90vh] max-h-[90vh]">
              
              <div className="md:w-1/3 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden border-r border-gray-200 dark:border-gray-800 flex flex-col">
                 <div className="h-64 relative shrink-0">
                   {selectedPerson.photo ? (
                     <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <User className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                     </div>
                   )}
                 </div>
                 
                 <div className="p-6 flex-1 overflow-y-auto">
                   <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedPerson.name}</h2>
                   <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">{selectedPerson.age ? `${selectedPerson.age} yrs` : 'Unknown Age'} • {selectedPerson.gender || 'Unknown'}</p>
                   
                   <div className="mt-6 space-y-4">
                     <div>
                       <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Status</span>
                       <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block mt-1", selectedPerson.status === 'FOUND' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                         {selectedPerson.status}
                       </span>
                     </div>
                     <div>
                       <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Reported Contact</span>
                       <p className="text-sm font-bold text-slate-800">{selectedPerson.contactName || 'None listed'}</p>
                       <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{selectedPerson.contactPhone || 'No phone'}</p>
                     </div>
                   </div>
                 </div>
              </div>

              <div className="flex-1 p-8 md:p-10 overflow-y-auto flex flex-col bg-white dark:bg-gray-900 relative">
                 <button onClick={() => setSelectedPerson(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-all z-10"><X className="w-5 h-5" /></button>
                 
                 <div className="space-y-8 pb-10">
                   <div>
                     <h3 className="text-lg font-black text-slate-800 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Case Details</h3>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                         <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Last Seen</span>
                         <span className="font-bold text-slate-700">{selectedPerson.lastSeen}</span>
                       </div>
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                         <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Reported Date</span>
                         <span className="font-bold text-slate-700">{new Date(selectedPerson.createdAt).toLocaleDateString()}</span>
                       </div>
                       <div className="col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                         <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Description</span>
                         <span className="text-slate-700">{selectedPerson.description}</span>
                       </div>
                     </div>
                   </div>

                   {/* Family Reunification Workflow */}
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                     <h3 className="text-lg font-black text-blue-900 mb-2 flex items-center gap-2"><Phone className="w-5 h-5" /> Family Reunification Workflow</h3>
                     <p className="text-sm text-blue-700 mb-6">Manage the process of returning this individual to their registered family contact.</p>

                     <div className="space-y-4">
                       <div className="flex items-center gap-4">
                         <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 w-32">Current State:</span>
                         <span className={cn("px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider",
                           selectedPerson.reunificationStatus === 'NONE' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                           selectedPerson.reunificationStatus === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' :
                           'bg-green-200 text-green-800'
                         )}>{selectedPerson.reunificationStatus.replace('_', ' ')}</span>
                       </div>
                       
                       <div className="flex flex-col gap-2">
                         <textarea 
                           value={reunificationNotes} onChange={e => setReunificationNotes(e.target.value)}
                           placeholder="Add an update to the reunification log..." rows={2}
                           className="w-full bg-white dark:bg-gray-900 border border-blue-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                         />
                         <div className="flex gap-2">
                           {selectedPerson.reunificationStatus !== 'IN_PROGRESS' && selectedPerson.reunificationStatus !== 'REUNITED' && (
                             <button onClick={() => handleReunify('IN_PROGRESS')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm">
                               Initiate Reunification (SMS Contact)
                             </button>
                           )}
                           {selectedPerson.reunificationStatus === 'IN_PROGRESS' && (
                             <button onClick={() => handleReunify('REUNITED')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm">
                               Mark as Reunited (Closes Case)
                             </button>
                           )}
                           <button onClick={() => handleReunify(selectedPerson.reunificationStatus)} disabled={!reunificationNotes} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
                             Save Log Note
                           </button>
                         </div>
                       </div>

                       {selectedPerson.reunificationNotes && (
                         <div className="mt-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                           {selectedPerson.reunificationNotes}
                         </div>
                       )}
                     </div>
                   </div>

                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )
}
