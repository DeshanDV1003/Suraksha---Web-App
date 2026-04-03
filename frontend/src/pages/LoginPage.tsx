import { useAuth } from '@/hooks/useAuth'
import { AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/20 p-4">
      <div className="max-w-md w-full bg-card border rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Suraksha</h1>
          <p className="text-muted-foreground">Disaster Management Coordination System</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <input 
              type="email" 
              placeholder="officer@dmc.gov.lk" 
              className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => login('DMC_OFFICER')}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg"
          >
            Login as DMC Officer
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Select Role For Testing</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => login('DMC_ADMIN')}
            className="py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            Admin
          </button>
          <button 
            onClick={() => login('VOLUNTEER')}
            className="py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            Volunteer
          </button>
        </div>
      </div>
    </div>
  )
}
