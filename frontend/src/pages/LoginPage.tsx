import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import backgroundVideo from '@/videos/Cinematic_Disaster_Response_Tech_Background.mp4'
import logo from '@/pictures/Full logo.png'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token2fa, setToken2fa] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [userIdFor2FA, setUserIdFor2FA] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedPassword = localStorage.getItem('rememberedPassword')
    if (savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

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
      const res = await login({ email, password, token2fa: requires2FA ? token2fa : undefined })
      if (res?.requires2FA) {
        setRequires2FA(true);
        setUserIdFor2FA(res.userId);
        return;
      }
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberedPassword', password)
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedPassword')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const details = err.response?.data?.details ? ` (${err.response.data.details})` : '';
      setError(message + details);
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Simulate API call for forgot password
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResetEmailSent(true)
    } catch (err) {
      setError('Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 font-sans">
      {/* Brand Header / Logo */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <img src={logo} alt="Suraksha Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none tracking-tight text-white uppercase drop-shadow-md">SURAKSHA</h1>
          <p className="text-[10px] text-white/90 font-bold uppercase tracking-wider mt-1.5 drop-shadow-sm">Command Center</p>
        </div>
      </div>

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

      {/* Overlay - Darkened to match the moody aesthetic of the screenshot */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="max-w-[400px] w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 space-y-8 animate-in fade-in zoom-in duration-700 relative z-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">{isForgotPassword ? 'RECOVER PASSWORD' : 'LOGIN'}</h1>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 text-white rounded text-sm text-center">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          resetEmailSent ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-green-500/20 border border-green-500/50 text-white rounded">
                Password reset link has been sent to your email.
              </div>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }}
                className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-white/90 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-4">
                <input
                  required
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-white/90 transition-colors flex items-center justify-center mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(''); }}
                className="w-full text-center text-sm text-white/70 hover:text-white mt-4"
              >
                Back to Login
              </button>
            </form>
          )
        ) : (
        <form onSubmit={handleLogin} className="space-y-6">
          {!requires2FA ? (
            <>
              <div className="space-y-4">
                <input
                  required
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  required
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-2 text-white placeholder:text-white/70 focus:ring-0 focus:border-white transition-colors mt-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-white pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/50 bg-white/10 text-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="group-hover:text-white/90">Remember me</span>
                </label>
                <a href="#" className="hover:underline hover:text-white/90" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(''); }}>Forgot password?</a>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <input
                required
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full bg-transparent border-0 border-b border-white/50 px-0 py-3 text-white placeholder:text-white/30 focus:ring-0 focus:border-white transition-colors text-center text-3xl tracking-[0.5em]"
                value={token2fa}
                onChange={(e) => setToken2fa(e.target.value)}
              />
              <p className="text-center text-sm text-white/80 pt-2">Enter your 2FA code</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-white/90 transition-colors flex items-center justify-center mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : requires2FA ? (
              "Verify Code"
            ) : (
              "Log In"
            )}
          </button>

          {requires2FA && (
            <button
              type="button"
              onClick={() => { setRequires2FA(false); setToken2fa(''); }}
              className="w-full text-center text-sm text-white/70 hover:text-white mt-4"
            >
              Cancel
            </button>
          )}
        </form>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-white/90">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
