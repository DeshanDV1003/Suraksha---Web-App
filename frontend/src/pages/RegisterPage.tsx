import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authService } from '../services/api'
import logo from '@/pictures/Half logo.png'
import backgroundVideo from '@/videos/Cinematic_Disaster_Response_Tech_Background.mp4'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    region: '',
    role: 'CITIZEN'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.register(formData)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 font-sans focus:outline-none">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-[2px]" />

      <div className="max-w-[480px] w-full bg-white/95 backdrop-blur-xl border-none rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Create Account</h1>
          <p className="text-slate-500 mt-1 font-medium">Join the Response Team</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Full Name</label>
            <input
              required
              type="text"
              placeholder="Deshan Silva"
              className="suraksha-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Email Address</label>
            <input
              required
              type="email"
              placeholder="officer@dmc.gov.lk"
              className="suraksha-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Phone Number</label>
              <input
                required
                type="tel"
                placeholder="+94 7X XXX XXXX"
                className="suraksha-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Assign Role</label>
              <select
                className="suraksha-input appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="DMC_OFFICER">DMC Officer</option>
                <option value="VOLUNTEER">Volunteer</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Region / Jurisdiction</label>
            <input
              required
              type="text"
              placeholder="e.g. Region 3 - Colombo"
              className="suraksha-input"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Password</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="suraksha-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="suraksha-button w-full h-14 flex items-center justify-center group"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                Register Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm font-bold text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0061ff] hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
