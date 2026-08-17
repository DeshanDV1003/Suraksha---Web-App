import { useEffect, useState } from 'react'
import { hospitalApi } from '@/services/hospitalApi'

interface Ward {
  id: string
  name: string
  totalBeds: number
  availableBeds: number
}

interface CapacityData {
  totalBeds: number
  availableBeds: number
  wards: Ward[]
}

export default function HospitalCapacityPage() {
  const [data, setData] = useState<CapacityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [hospitalEdit, setHospitalEdit] = useState({ totalBeds: 0, availableBeds: 0 })
  const [wardEdits, setWardEdits] = useState<Record<string, { totalBeds: number; availableBeds: number }>>({})
  const [newWard, setNewWard] = useState({ name: '', totalBeds: 0 })
  const [addingWard, setAddingWard] = useState(false)

  const load = () => {
    setLoading(true)
    hospitalApi.getCapacity().then((d) => {
      setData(d)
      setHospitalEdit({ totalBeds: d.totalBeds, availableBeds: d.availableBeds })
      const we: Record<string, { totalBeds: number; availableBeds: number }> = {}
      d.wards.forEach((w: Ward) => { we[w.id] = { totalBeds: w.totalBeds, availableBeds: w.availableBeds } })
      setWardEdits(we)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const saveHospital = async () => {
    setSaving('hospital')
    await hospitalApi.updateCapacity(hospitalEdit)
    setSaving(null)
    load()
  }

  const saveWard = async (wardId: string) => {
    setSaving(wardId)
    await hospitalApi.updateWard(wardId, wardEdits[wardId])
    setSaving(null)
    load()
  }

  const addWard = async () => {
    if (!newWard.name) return
    setAddingWard(true)
    await hospitalApi.createWard(newWard)
    setNewWard({ name: '', totalBeds: 0 })
    setAddingWard(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bed Capacity Management</h1>

      {/* Hospital-level */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wider">Hospital Total</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Beds
            <input type="number" min={0} className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              value={hospitalEdit.totalBeds}
              onChange={(e) => setHospitalEdit(h => ({ ...h, totalBeds: +e.target.value }))} />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Available Beds
            <input type="number" min={0} className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              value={hospitalEdit.availableBeds}
              onChange={(e) => setHospitalEdit(h => ({ ...h, availableBeds: +e.target.value }))} />
          </label>
        </div>
        <button onClick={saveHospital} disabled={saving === 'hospital'}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">
          {saving === 'hospital' ? 'Saving…' : 'Update Hospital Capacity'}
        </button>
      </div>

      {/* Wards */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wider">Wards</h2>
          <span className="text-xs text-gray-400">{data.wards.length} wards</span>
        </div>

        {data.wards.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No wards added yet</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.wards.map((w) => (
              <div key={w.id} className="px-5 py-4 flex items-center gap-4">
                <span className="flex-1 font-medium text-gray-800 dark:text-white text-sm">{w.name}</span>
                <div className="flex gap-3 items-center">
                  <label className="text-xs text-gray-500">
                    Total
                    <input type="number" min={0}
                      className="ml-1.5 w-16 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                      value={wardEdits[w.id]?.totalBeds ?? w.totalBeds}
                      onChange={(e) => setWardEdits(we => ({ ...we, [w.id]: { ...we[w.id], totalBeds: +e.target.value } }))} />
                  </label>
                  <label className="text-xs text-gray-500">
                    Available
                    <input type="number" min={0}
                      className="ml-1.5 w-16 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
                      value={wardEdits[w.id]?.availableBeds ?? w.availableBeds}
                      onChange={(e) => setWardEdits(we => ({ ...we, [w.id]: { ...we[w.id], availableBeds: +e.target.value } }))} />
                  </label>
                  <button onClick={() => saveWard(w.id)} disabled={saving === w.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold disabled:opacity-50">
                    {saving === w.id ? '…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add ward */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <input type="text" placeholder="Ward name" value={newWard.name}
            onChange={(e) => setNewWard(w => ({ ...w, name: e.target.value }))}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm" />
          <input type="number" min={0} placeholder="Beds" value={newWard.totalBeds || ''}
            onChange={(e) => setNewWard(w => ({ ...w, totalBeds: +e.target.value }))}
            className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm" />
          <button onClick={addWard} disabled={addingWard || !newWard.name}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50">
            {addingWard ? '…' : 'Add Ward'}
          </button>
        </div>
      </div>
    </div>
  )
}
