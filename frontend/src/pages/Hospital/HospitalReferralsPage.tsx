import { useEffect, useState } from 'react'
import { hospitalApi } from '@/services/hospitalApi'
import { io } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ADMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  DISCHARGED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  TRANSFERRED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  DECEASED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-green-600',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600',
}

const STATUSES = ['', 'PENDING', 'ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'DECEASED']

interface Referral {
  id: string
  patientName: string
  patientAge?: number
  conditionSeverity: string
  conditionNotes?: string
  transportMethod?: string
  hospitalNotes?: string
  outcome?: string
  status: string
  admittedAt?: string
  dischargedAt?: string
  createdAt: string
  camp: { name: string; location: string }
}

export default function HospitalReferralsPage() {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Referral | null>(null)
  const [updateForm, setUpdateForm] = useState({ status: '', hospitalNotes: '', outcome: '' })
  const [saving, setSaving] = useState(false)
  const [newAlert, setNewAlert] = useState(false)

  const load = () => {
    setLoading(true)
    hospitalApi.getReferrals({ status: statusFilter || undefined, page, limit: 15 })
      .then((d) => { setReferrals(d.referrals); setTotal(d.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, statusFilter])

  // Join hospital socket room for real-time referral notifications
  useEffect(() => {
    if (!user?.hospitalId) return
    const socket = io('http://localhost:3001')
    socket.emit('join_hospital', user.hospitalId)
    socket.on('new-referral', () => {
      setNewAlert(true)
      load()
    })
    return () => { socket.disconnect() }
  }, [user?.hospitalId])

  const openDetail = (r: Referral) => {
    setSelected(r)
    setUpdateForm({ status: r.status, hospitalNotes: r.hospitalNotes ?? '', outcome: r.outcome ?? '' })
  }

  const saveUpdate = async () => {
    if (!selected) return
    setSaving(true)
    await hospitalApi.updateReferral(selected.id, updateForm)
    setSaving(false)
    setSelected(null)
    load()
  }

  const pages = Math.ceil(total / 15)

  return (
    <div className="space-y-4">
      {newAlert && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3">
          <span className="text-amber-600 font-bold text-sm">New referral received</span>
          <button onClick={() => setNewAlert(false)} className="ml-auto text-xs text-amber-500 hover:underline">Dismiss</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Referrals</h1>
        <select
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No referrals found</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Camp</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {r.patientName}
                    {r.patientAge && <span className="text-gray-400 ml-1">({r.patientAge}y)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.camp.name}</td>
                  <td className={`px-4 py-3 font-semibold ${SEVERITY_COLORS[r.conditionSeverity]}`}>{r.conditionSeverity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(r)} className="text-xs text-brand-600 hover:underline font-medium">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Update modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Update Referral — {selected.patientName}</h2>

            <div className="space-y-1">
              <div className="text-xs text-gray-500">From: {selected.camp.name} · {selected.conditionSeverity} severity</div>
              {selected.conditionNotes && <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{selected.conditionNotes}</div>}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
                <select
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hospital Notes
                <textarea
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm resize-none"
                  rows={3}
                  value={updateForm.hospitalNotes}
                  onChange={(e) => setUpdateForm(f => ({ ...f, hospitalNotes: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outcome
                <input
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  value={updateForm.outcome}
                  onChange={(e) => setUpdateForm(f => ({ ...f, outcome: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2 rounded-xl border text-sm text-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={saveUpdate} disabled={saving} className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
