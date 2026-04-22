import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AlertTriangle } from 'lucide-react'
import logo from '@/pictures/Half logo.png'
import backgroundVideo from '@/videos/Cinematic_Disaster_Response_Tech_Background.mp4'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login({ email, password })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 font-sans">
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

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border-none rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b]">Suraksha</h1>
          <p className="text-slate-500 font-medium">Disaster Management Coordination</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="officer@dmc.gov.lk" 
              className="suraksha-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••" 
              className="suraksha-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="suraksha-button w-full h-14 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        <div className="text-center pt-4 space-y-4">
           <p className="text-sm font-bold text-slate-400">
             Don't have an account?{' '}
             <Link to="/register" className="text-[#0061ff] hover:underline">Sign Up</Link>
           </p>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Suraksha v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
