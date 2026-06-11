import { useState, useEffect } from 'react'
import { Search, MapPin, Send, Loader2, CheckCircle2, UserSearch } from 'lucide-react'
import { missingPersonService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export default function PublicMissingPortal() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('search') // search, report
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lastSeen: '',
    age: '',
    contactName: '',
    contactPhone: ''
  })

  useEffect(() => {
    if (activeTab === 'search') {
      fetchMissing()
    }
  }, [activeTab])

  const fetchMissing = async () => {
    setLoading(true)
    try {
      const res = await missingPersonService.publicGetMissing()
      setSearchResults(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredResults = searchResults.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.lastSeen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await missingPersonService.publicReportMissing({
        ...formData,
        age: parseInt(formData.age) || null
      })
      setSuccess(true)
    } catch (err: any) {
      setError('Failed to submit report. Please try again or contact authorities.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Report Submitted</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The missing person report has been logged in the national database. Authorities will be in touch if there is any update.</p>
          <button 
            onClick={() => { setSuccess(false); setActiveTab('search'); fetchMissing(); }}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all"
          >
            Return to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserSearch className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Missing Persons Public Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Search the national database or report a missing loved one. If you have information about any of these individuals, please contact authorities immediately.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-4 font-bold text-sm text-center transition-colors ${activeTab === 'search' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50'}`}
            >
              Search Database
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-4 font-bold text-sm text-center transition-colors ${activeTab === 'report' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50'}`}
            >
              Report Missing Person
            </button>
          </div>

          <div className="p-6 sm:p-10">
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, location, or description..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 py-4 pl-12 pr-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredResults.length === 0 ? (
                      <p className="col-span-2 text-center text-gray-400 dark:text-gray-500 py-10 font-medium">No matching records found.</p>
                    ) : (
                      filteredResults.map(person => (
                        <div key={person.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-black text-lg text-slate-800">{person.name} {person.isUnidentified && "(Unidentified)"}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${person.status === 'FOUND' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {person.status}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {person.age && <p><span className="font-bold text-gray-500 dark:text-gray-400">Age:</span> {person.age}</p>}
                            <p className="flex gap-2 items-start"><MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" /> <span><span className="font-bold text-gray-500 dark:text-gray-400">Last Seen:</span> {person.lastSeen}</span></p>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">{person.description}</p>
                          </div>
                          <div className="mt-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                            Reported {formatDistanceToNow(new Date(person.createdAt))} ago
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input type="text" required className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Age</label>
                    <input type="number" className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Last Seen Location & Time</label>
                    <input type="text" required placeholder="e.g. Near Main Market, Colombo around 2 PM yesterday" className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.lastSeen} onChange={e => setFormData({...formData, lastSeen: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description (Clothing, identifiable marks)</label>
                    <textarea required rows={3} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4">Your Contact Information (For Reunification)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Name</label>
                      <input type="text" required className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Contact Phone</label>
                      <input type="tel" required className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />} Submit Report
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
