import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authService } from '../services/api'
import logo from '@/pictures/Full logo.png'

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans focus:outline-none">
      <div className="max-w-[480px] w-full bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1e293b]">Create Account</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Join the Response Team</p>
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
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Assign Role</label>
              <select 
                className="suraksha-input appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
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
              onChange={(e) => setFormData({...formData, region: e.target.value})}
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
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
