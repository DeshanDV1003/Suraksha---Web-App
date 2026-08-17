import { useEffect, useState } from 'react'
import { hospitalApi } from '@/services/hospitalApi'
import { Link } from 'react-router-dom'

interface DashboardData {
  hospital: {
    name: string
    location: string
    totalBeds: number
    availableBeds: number
    specialties: string[]
    phone?: string
    email?: string
  }
  referrals: {
    PENDING: number
    ADMITTED: number
    DISCHARGED: number
    TRANSFERRED: number
    DECEASED: number
  }
}

export default function HospitalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    hospitalApi.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!data) return null

  const { hospital, referrals } = data
  const occupancyPct = hospital.totalBeds > 0
    ? Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100)
    : 0

  const statCards = [
    { label: 'Pending Referrals', value: referrals.PENDING, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Admitted', value: referrals.ADMITTED, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Discharged', value: referrals.DISCHARGED, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Available Beds', value: hospital.availableBeds, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hospital.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{hospital.location}</p>
          {hospital.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hospital.specialties.map((s) => (
                <span key={s} className="text-xs bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 px-2 py-0.5 rounded-full font-medium">{s}</span>
              ))}
            </div>
          )}
        </div>
        <Link to="/hospital/capacity" className="text-sm text-brand-600 hover:underline font-medium">Manage Capacity →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.bg}`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-gray-700 dark:text-gray-300">Bed Occupancy</span>
          <span className="text-gray-500">{hospital.totalBeds - hospital.availableBeds} / {hospital.totalBeds} ({occupancyPct}%)</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${occupancyPct > 85 ? 'bg-red-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/hospital/referrals"
          className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand-400 transition-colors group"
        >
          <div className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-brand-600">Patient Referrals</div>
          <div className="text-sm text-gray-500 mt-1">View and manage incoming referrals from relief camps</div>
        </Link>
        <Link
          to="/hospital/capacity"
          className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand-400 transition-colors group"
        >
          <div className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-brand-600">Ward Capacity</div>
          <div className="text-sm text-gray-500 mt-1">Update available beds and ward-level breakdown</div>
        </Link>
      </div>
    </div>
  )
}
