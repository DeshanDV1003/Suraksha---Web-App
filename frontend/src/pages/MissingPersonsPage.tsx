import { useState, useEffect } from 'react'
import { UserSearch, Plus, X, MapPin, Clock, Loader2, User, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { missingPersonService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export default function MissingPersonsPage() {
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<any>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
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
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      name: formData.get('name'),
      age: parseInt(formData.get('age') as string),
      description: formData.get('description'),
      lastSeen: formData.get('lastSeen'),
      photo: selectedImage || ''
    }

    try {
      setIsSubmitting(true)
      await missingPersonService.reportMissing(data)
      alert('Missing person reported successfully')
      setShowModal(false)
      setSelectedImage(null)
      fetchData()
    } catch (error) {
      console.error('Failed to report missing person:', error)
      alert('Failed to report missing person')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Missing Persons</h1>
          <p className="text-slate-500 font-medium">Coordinate search operations and reporting</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Report Missing Person
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning Database</p>
          </div>
        ) : persons.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
            <UserSearch className="w-16 h-16 text-slate-200 mx-auto" />
            <h3 className="text-xl font-bold text-slate-700">No Reports Filed</h3>
            <p className="text-slate-400 max-w-xs mx-auto">All individuals accounted for. Any new reports will appear here instantly.</p>
          </div>
        ) : (
          persons.map((person) => (
            <div key={person.id} className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-red-500/5 transition-all overflow-hidden">
               <div className="relative h-64 -mx-6 -mt-6 mb-6 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <User className="w-20 h-20 text-slate-200" />
                  )}
                  {person.status === 'FOUND' && (
                    <div className="absolute top-4 right-4 z-20 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                       Found
                    </div>
                  )}
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-lg font-black text-slate-900">{person.name}</h3>
                        <p className="text-xs font-bold text-slate-400">{person.age} Years Old</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="truncate">Last seen: {person.lastSeen}</span>
                     </div>
                     <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{person.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(person.createdAt))} ago
                     </div>
                     <button 
                        onClick={() => setSelectedPerson(person)}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                      >
                        View Details
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8">
         <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0">
            <Phone className="w-8 h-8 text-white" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-blue-900">Emergency Search Hotline</h3>
            <p className="text-blue-700 font-medium mt-1">If you have immediate information about a missing person, call <span className="font-black">119</span> or our rescue center at <span className="font-black">+94 112 345 678</span></p>
         </div>
         <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold border border-blue-100 hover:shadow-lg transition-all">
            Call Now
         </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Report Missing Person</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input name="name" type="text" placeholder="Legal name" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Age</label>
                  <input name="age" type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Seen Location</label>
                <input name="lastSeen" type="text" placeholder="City, Street, or Landmark" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description (Appearance, Clothes)</label>
                <textarea name="description" rows={3} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none resize-none"></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Upload Recent Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-dashed border-slate-300">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-300" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Please upload a clear, front-facing photo of the individual for better identification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "File Official Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]">
            
            {/* Left side: Image */}
            <div className="md:w-5/12 bg-slate-50 relative overflow-hidden">
               {selectedPerson.photo ? (
                 <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                    <User className="w-32 h-32 text-slate-200" />
                 </div>
               )}
               <div className="absolute top-6 left-6">
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
                    selectedPerson.status === 'FOUND' ? "bg-green-500 text-white" : "bg-red-600 text-white"
                  )}>
                    {selectedPerson.status}
                  </div>
               </div>
            </div>

            {/* Right side: Details */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{selectedPerson.name}</h2>
                    <div className="flex items-center gap-2 mt-3">
                       <span className="text-slate-400 font-bold text-sm">{selectedPerson.age} Years Old</span>
                       <span className="w-1 h-1 rounded-full bg-slate-300" />
                       <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">Male</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPerson(null)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  {/* Status Section */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Last Seen At</label>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                           <MapPin className="w-5 h-5 text-red-500" />
                           {selectedPerson.lastSeen}
                        </div>
                     </div>
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reported Date</label>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                           <Clock className="w-5 h-5 text-slate-400" />
                           {new Date(selectedPerson.createdAt).toLocaleDateString()}
                        </div>
                     </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Physical Description & Notes</label>
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 relative">
                       <p className="text-slate-600 font-medium leading-relaxed italic">
                         "{selectedPerson.description}"
                       </p>
                    </div>
                  </div>

                  {/* Identification Section */}
                  <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
                     <div>
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Record ID</p>
                        <p className="font-mono text-sm font-bold">MP-RE-#{selectedPerson.id.slice(0, 8).toUpperCase()}</p>
                     </div>
                     <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-md">
                        Copy Reference
                     </button>
                  </div>

                  {/* Actions Section */}
                  <div className="flex gap-4 pt-4">
                     <button className="flex-1 py-5 bg-[#E11D48] text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2">
                        Generate Missing Poster
                     </button>
                     <button className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        Notify Search Team
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
