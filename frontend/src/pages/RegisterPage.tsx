import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import loginBg from '@/pictures/login_bg.png'

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
  const [validationCode, setValidationCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.role !== 'CITIZEN') {
      if (formData.role === 'DMC_OFFICER' && validationCode !== 'DMC-2026-SECURE') {
        setError('Invalid validation code for DMC Officer role.');
        return;
      }
      if (formData.role === 'VOLUNTEER' && validationCode !== 'VOL-2026-ACTIVE') {
        setError('Invalid validation code for Volunteer role.');
        return;
      }
    }

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
      {/* Static Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-950/70 to-slate-900/85" />

      {/* Animated radar/pulse rings — CSS-only, no video */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
        <div className="relative w-[600px] h-[600px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-cyan-400/20"
              style={{
                animation: `loginPulse 4s ease-out infinite`,
                animationDelay: `${i * 1}s`,
                transform: 'scale(0)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-[1]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,214,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,214,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes loginPulse {
          0%   { transform: scale(0.1); opacity: 0.6; }
          80%  { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      <div className="max-w-[480px] w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 space-y-8 animate-in fade-in zoom-in duration-700 relative z-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Register</h1>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 text-white rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            required
            type="text"
            placeholder="Full Name"
            className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <input
            required
            type="email"
            placeholder="Email Address"
            className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              required
              type="tel"
              placeholder="Phone Number"
              className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <div className="relative">
              <select
                className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white focus:ring-0 focus:border-white transition-colors appearance-none cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="CITIZEN" className="text-black">Citizen</option>
                <option value="DMC_OFFICER" className="text-black">DMC Officer</option>
                <option value="VOLUNTEER" className="text-black">Volunteer</option>
              </select>
            </div>
          </div>

          <input
            required
            type="text"
            placeholder="Region / Jurisdiction (e.g. Region 3)"
            className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          />

          <input
            required
            type="password"
            placeholder="Password"
            className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {formData.role !== 'CITIZEN' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                required
                type="text"
                placeholder={`${formData.role === 'DMC_OFFICER' ? 'DMC' : 'Volunteer'} Validation Code`}
                className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
              />
              <p className="text-xs text-white/50 mt-1">
                Required for {formData.role === 'DMC_OFFICER' ? 'DMC Officer' : 'Volunteer'} registration.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-white/90 transition-colors flex items-center justify-center mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-white/90">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
