import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, MapPin, Send, Loader2, CheckCircle2, Phone } from 'lucide-react'
import { helpRequestService } from '@/services/api'

const INITIAL_FORM = {
  type: 'Rescue',
  description: '',
  location: '',
  latitude: null as number | null,
  longitude: null as number | null,
  peopleCount: 1,
  phone: ''
}

export default function PublicRequestPortal() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedId, setSubmittedId] = useState('')
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)

  const set = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        }))
        setGettingLocation(false)
      },
      () => {
        setError(t('public_request_portal.location_failed'))
        setGettingLocation(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
      }
      const res = await helpRequestService.createPublicRequest(payload)
      setSubmittedId(res.data?.id || '')
      setSuccess(true)
    } catch {
      setError(t('public_request_portal.submit_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setSubmittedId('')
    setFormData(INITIAL_FORM)
    setError('')
  }

  const inputClass = "w-full bg-[#0a1628] border border-white/10 text-white/90 placeholder-slate-600 p-4 rounded-xl font-medium focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all"
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"

  if (success) {
    return (
      <div className="min-h-screen bg-[#0e1d36] flex items-center justify-center p-4">
        <div className="bg-[#131f33] border border-white/10 p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white/90 mb-2">{t('public_request_portal.request_received')}</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            {t('public_request_portal.signal_routed')}
          </p>
          {submittedId && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('public_request_portal.reference_number')}</p>
              <p className="font-mono font-black text-cyan-400 text-sm break-all">{submittedId}</p>
              <p className="text-[10px] text-slate-500 mt-1">{t('public_request_portal.keep_reference')}</p>
            </div>
          )}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 text-left">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-300">{t('public_request_portal.emergency_hotline')}</p>
              <p className="text-sm font-black text-amber-400">1919</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-500 transition-all"
          >
            {t('public_request_portal.submit_another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e1d36] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#131f33] border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white/90">{t('public_request_portal.request_help')}</h1>
            <p className="text-sm text-slate-400 font-medium">{t('public_request_portal.portal_subtitle')}</p>
          </div>
        </div>

        {/* Hotline banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <Phone className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 font-bold">
            {t('public_request_portal.hotline_warning')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-bold mb-5 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Emergency type */}
          <div>
            <label className={labelClass}>{t('public_request_portal.emergency_type')}</label>
            <select
              required
              className={inputClass + ' cursor-pointer'}
              value={formData.type}
              onChange={e => set('type', e.target.value)}
            >
              <option value="Rescue">{t('public_request_portal.rescue_trapped')}</option>
              <option value="Medical">{t('public_request_portal.medical_emergency')}</option>
              <option value="Food/Water">{t('public_request_portal.need_food_water')}</option>
              <option value="Shelter">{t('public_request_portal.need_shelter')}</option>
              <option value="Other">{t('public_request_portal.other')}</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>{t('public_request_portal.location')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder={t('public_request_portal.address_placeholder')}
                className={inputClass}
                value={formData.location}
                onChange={e => set('location', e.target.value)}
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                title="Use current GPS location"
                className="bg-white/8 border border-white/10 text-slate-300 p-4 rounded-xl hover:bg-white/15 transition-colors flex items-center justify-center disabled:opacity-50 shrink-0"
              >
                {gettingLocation
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <MapPin className="w-5 h-5" />
                }
              </button>
            </div>
            {formData.latitude && (
              <p className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t('public_request_portal.gps_captured')}
              </p>
            )}
          </div>

          {/* People count + phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('public_request_portal.people_affected')}</label>
              <input
                type="number"
                min="1"
                required
                className={inputClass}
                value={formData.peopleCount}
                onChange={e => set('peopleCount', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('public_request_portal.contact_number')}</label>
              <input
                type="tel"
                required
                placeholder={t('public_request_portal.mobile_placeholder')}
                className={inputClass}
                value={formData.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>{t('public_request_portal.describe_situation')}</label>
            <textarea
              required
              rows={3}
              placeholder={t('public_request_portal.describe_placeholder')}
              className={inputClass + ' resize-none'}
              value={formData.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            {t('public_request_portal.send_distress')}
          </button>
        </form>
      </div>
    </div>
  )
}
