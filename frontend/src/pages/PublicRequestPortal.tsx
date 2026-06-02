import { useState } from 'react'
import { AlertTriangle, MapPin, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { helpRequestService } from '@/services/api'

export default function PublicRequestPortal() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    type: 'Rescue',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    peopleCount: 1,
    phone: ''
  })

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({
          ...formData,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        })
        setGettingLocation(false)
      },
      (err) => {
        setError('Failed to auto-detect location. Please type it manually.')
        setGettingLocation(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await helpRequestService.createPublicRequest(formData)
      setSuccess(true)
    } catch (err: any) {
      setError('Failed to submit request. Please try again or call 1919.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Request Received</h2>
          <p className="text-slate-500 mb-8">Your distress signal has been routed to the Suraksha Command Center. Responders are being dispatched.</p>
          <button 
            onClick={() => { setSuccess(false); setFormData({ ...formData, description: '' }) }}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Request Help</h1>
            <p className="text-sm text-slate-500 font-medium">Suraksha Emergency Portal</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Emergency Type</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="Rescue">Rescue / Trapped</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Food/Water">Need Food & Water</option>
              <option value="Shelter">Need Evacuation / Shelter</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location</label>
            <div className="flex gap-2">
              <input 
                type="text" required placeholder="Address or landmark"
                className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
              />
              <button 
                type="button" onClick={handleGetLocation} disabled={gettingLocation}
                className="bg-slate-100 text-slate-600 p-4 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Use current GPS location"
              >
                {gettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">People Affected</label>
              <input 
                type="number" min="1" required
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
                value={formData.peopleCount} onChange={e => setFormData({...formData, peopleCount: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Number</label>
              <input 
                type="tel" required placeholder="Mobile No."
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Describe the situation</label>
            <textarea 
              required rows={3} placeholder="Provide critical details (e.g., 'Water level rising, elderly person trapped')."
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            Send Distress Signal
          </button>
        </form>
      </div>
    </div>
  )
}
