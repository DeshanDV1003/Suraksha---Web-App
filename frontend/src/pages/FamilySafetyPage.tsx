import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { ShieldAlert, ShieldCheck, HelpCircle, HeartPulse, Search, MapPin, Users, X, ChevronRight, CheckCircle2, AlertTriangle, Plus, Pencil, Trash2, Loader2, UserCircle2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useAuth } from '@/hooks/useAuth';

// ── Citizen Family Safety View ───────────────────────────────────────────────
const MY_STATUSES = [
  { value: 'SAFE',       label: '✅ Safe',            color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400' },
  { value: 'EVACUATED',  label: '🏃 Evacuated',       color: 'border-blue-500/50 bg-blue-500/15 text-blue-400' },
  { value: 'NEEDS_HELP', label: '🆘 Needs Help',      color: 'border-orange-500/50 bg-orange-500/15 text-orange-400' },
  { value: 'INJURED',    label: '🩹 Injured',         color: 'border-red-500/50 bg-red-500/15 text-red-400' },
  { value: 'TRAPPED',    label: '⚠️ Trapped',         color: 'border-red-700/50 bg-red-700/15 text-red-300' },
]

const MEMBER_STATUS_OPTS = ['SAFE', 'EVACUATED', 'NEEDS_HELP', 'INJURED', 'TRAPPED', 'MISSING', 'UNKNOWN']

const statusBadge: Record<string, string> = {
  SAFE:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  EVACUATED:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  NEEDS_HELP: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  INJURED:    'bg-red-500/15 text-red-400 border-red-500/30',
  TRAPPED:    'bg-red-700/15 text-red-300 border-red-700/30',
  MISSING:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
  UNKNOWN:    'bg-white/8 text-slate-400 border-white/15',
}

function CitizenFamilySafety() {
  const [myStatus, setMyStatus] = useState<any>(null)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Check-in state
  const [checkingIn, setCheckingIn] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('SAFE')
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)

  // Member form state
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ name: '', relation: '', age: '', phone: '', status: 'SAFE', notes: '' })
  const [savingMember, setSavingMember] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      const res = await api.get('/family/my-status')
      setMyStatus(res.data.myStatus)
      setFamilyMembers(res.data.familyMembers)
    } catch {
      showToast('Failed to load family data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const getGPS = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false) },
      () => { showToast('Could not get location', 'error'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submitCheckIn = async () => {
    setSubmittingCheckIn(true)
    try {
      await api.post('/family/status', {
        status: selectedStatus,
        message: message || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      })
      showToast('Safety status updated!')
      setCheckingIn(false)
      setMessage('')
      setCoords(null)
      fetchData()
    } catch {
      showToast('Failed to update status', 'error')
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  const openAddMember = () => {
    setEditingMember(null)
    setMemberForm({ name: '', relation: '', age: '', phone: '', status: 'SAFE', notes: '' })
    setShowMemberForm(true)
  }

  const openEditMember = (m: any) => {
    setEditingMember(m)
    setMemberForm({ name: m.name, relation: m.relation || '', age: m.age ? String(m.age) : '', phone: m.phone || '', status: m.status || 'SAFE', notes: m.notes || '' })
    setShowMemberForm(true)
  }

  const saveMember = async () => {
    if (!memberForm.name.trim()) return showToast('Name is required', 'error')
    setSavingMember(true)
    try {
      if (editingMember) {
        await api.patch(`/family/members/${editingMember.id}`, memberForm)
        showToast('Family member updated!')
      } else {
        await api.post('/family/members', memberForm)
        showToast('Family member added!')
      }
      setShowMemberForm(false)
      fetchData()
    } catch {
      showToast('Failed to save family member', 'error')
    } finally {
      setSavingMember(false)
    }
  }

  const deleteMember = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/family/members/${id}`)
      showToast('Family member removed')
      fetchData()
    } catch {
      showToast('Failed to remove member', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>

  const currentStatusCfg = MY_STATUSES.find(s => s.value === myStatus?.status)

  return (
    <div className="space-y-6 w-full pb-10">

      {/* ── My Safety Status ── */}
      <div className="suraksha-card p-6 rounded-[1.5rem] space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <UserCircle2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white/90">My Safety Status</h2>
              <p className="text-xs text-slate-400 font-medium">Let the command centre know you are safe</p>
            </div>
          </div>
          {!checkingIn && (
            <button
              onClick={() => { setCheckingIn(true); setSelectedStatus(myStatus?.status || 'SAFE') }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-bold hover:bg-cyan-500/25 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              {myStatus ? 'Update Status' : 'Check In'}
            </button>
          )}
        </div>

        {/* Current status display */}
        {myStatus && !checkingIn && (
          <div className={cn('flex items-center gap-3 p-4 rounded-xl border', currentStatusCfg?.color || 'border-white/10 bg-white/5')}>
            <div className="text-2xl">{currentStatusCfg?.label.split(' ')[0]}</div>
            <div>
              <p className="font-black text-sm">{currentStatusCfg?.label.split(' ').slice(1).join(' ') || myStatus.status.replace(/_/g, ' ')}</p>
              {myStatus.message && <p className="text-xs opacity-80 mt-0.5">"{myStatus.message}"</p>}
              <p className="text-xs opacity-60 mt-1">Last updated {format(new Date(myStatus.createdAt), 'MMM d, h:mm a')}</p>
            </div>
            {myStatus.latitude && (
              <div className="ml-auto flex items-center gap-1 text-xs opacity-60">
                <MapPin className="w-3 h-3" />
                {myStatus.latitude.toFixed(4)}, {myStatus.longitude.toFixed(4)}
              </div>
            )}
          </div>
        )}

        {!myStatus && !checkingIn && (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 text-sm font-medium">
            You haven't checked in yet. Let your family and responders know you're safe.
          </div>
        )}

        {/* Check-in form */}
        {checkingIn && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Your Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MY_STATUSES.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setSelectedStatus(s.value)}
                    className={cn('p-3 rounded-xl text-sm font-bold text-left border transition-all', selectedStatus === s.value ? s.color : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 hover:border-cyan-400/40')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Message (optional)</label>
              <input value={message} onChange={e => setMessage(e.target.value)}
                placeholder="e.g. At neighbour's house, all OK"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={getGPS} disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:border-cyan-400/40 transition-all disabled:opacity-50">
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-cyan-400" />}
                {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Attach GPS Location'}
              </button>
              {coords && <button onClick={() => setCoords(null)} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Remove</button>}
            </div>

            <div className="flex gap-3">
              <button onClick={submitCheckIn} disabled={submittingCheckIn}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                {submittingCheckIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submittingCheckIn ? 'Submitting…' : 'Submit Check-In'}
              </button>
              <button onClick={() => setCheckingIn(false)}
                className="px-5 py-3 border border-slate-200 dark:border-white/10 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Family Members ── */}
      <div className="suraksha-card p-6 rounded-[1.5rem] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white/90">My Family Members</h2>
              <p className="text-xs text-slate-400 font-medium">Track the safety of your family</p>
            </div>
          </div>
          <button onClick={openAddMember}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-500/25 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>

        {familyMembers.length === 0 && (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 text-sm font-medium">
            No family members added yet. Add them to track their safety status.
          </div>
        )}

        <div className="space-y-3">
          {familyMembers.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-sm shrink-0">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-sm text-slate-800 dark:text-white/90">{m.name}</p>
                  {m.relation && <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 font-bold uppercase tracking-wider">{m.relation}</span>}
                  {m.age && <span className="text-xs text-slate-400">{m.age}y</span>}
                </div>
                {m.phone && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{m.phone}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-black uppercase border tracking-wider', statusBadge[m.status] || statusBadge.UNKNOWN)}>
                  {(m.status || 'UNKNOWN').replace(/_/g, ' ')}
                </span>
                <button onClick={() => openEditMember(m)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/8 hover:bg-cyan-500/15 hover:text-cyan-400 text-slate-400 flex items-center justify-center transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMember(m.id)} disabled={deletingId === m.id} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/8 hover:bg-red-500/15 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all disabled:opacity-50">
                  {deletingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add/Edit Member Modal ── */}
      {showMemberForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setShowMemberForm(false)}>
          <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-100 dark:bg-[#0e1d36] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-white/90">{editingMember ? 'Edit Family Member' : 'Add Family Member'}</h3>
              <button onClick={() => setShowMemberForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Amara Perera"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Relation</label>
                  <input value={memberForm.relation} onChange={e => setMemberForm(f => ({ ...f, relation: e.target.value }))}
                    placeholder="e.g. Mother, Son"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Age</label>
                  <input type="number" value={memberForm.age} onChange={e => setMemberForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="e.g. 65"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone</label>
                  <input value={memberForm.phone} onChange={e => setMemberForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 0771234567"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Current Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {MEMBER_STATUS_OPTS.map(s => (
                    <button key={s} type="button" onClick={() => setMemberForm(f => ({ ...f, status: s }))}
                      className={cn('p-2 rounded-xl text-xs font-bold border text-center transition-all', memberForm.status === s ? (statusBadge[s] || 'border-cyan-400/50 bg-cyan-500/15 text-cyan-400') : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 hover:border-cyan-400/30')}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Notes (optional)</label>
                <input value={memberForm.notes} onChange={e => setMemberForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. At Colombo hospital, ward 3"
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
              </div>
              <button onClick={saveMember} disabled={savingMember}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                {savingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {savingMember ? 'Saving…' : editingMember ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn('fixed bottom-8 right-8 z-[9999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300',
          toast.type === 'success' ? 'bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30')}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export const FamilySafetyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCitizen = user?.role === 'CITIZEN' || user?.role === 'VOLUNTEER';
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [overridingMember, setOverridingMember] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'warning'} | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRoster = async () => {
    try {
      const response = await api.get('/family/roster');
      setRoster(response.data);
    } catch (error) {
      showToast(t('family_safety_page.failed_load'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoster(); }, []);

  // Refresh selectedUser when roster updates
  useEffect(() => {
    if (selectedUser) {
      const updated = roster.find(r => r.userId === selectedUser.userId);
      if (updated) setSelectedUser(updated);
    }
  }, [roster]);

  const stats = useMemo(() => {
    const total = roster.length;
    const safe = roster.filter(r => r.latestCheckIn?.status === 'SAFE').length;
    const needsHelp = roster.filter(r => ['NEEDS_HELP', 'INJURED', 'TRAPPED'].includes(r.latestCheckIn?.status)).length;
    const evacuated = roster.filter(r => r.latestCheckIn?.status === 'EVACUATED').length;
    const unknown = roster.filter(r => !r.latestCheckIn).length;
    return { total, safe, needsHelp, evacuated, unknown };
  }, [roster]);

  const filteredRoster = useMemo(() => {
    return roster.filter(r => {
      const status = r.latestCheckIn?.status || 'UNKNOWN';
      const matchesFilter =
        filter === 'ALL' ? true :
        filter === 'NEEDS_ATTENTION' ? ['NEEDS_HELP', 'INJURED', 'TRAPPED'].includes(status) :
        filter === 'UNKNOWN' ? !r.latestCheckIn :
        status === filter;
      const matchesSearch =
        !search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [roster, filter, search]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE': return <ShieldCheck className="w-4 h-4 text-green-400" />;
      case 'NEEDS_HELP': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'INJURED': return <HeartPulse className="w-4 h-4 text-orange-400" />;
      case 'EVACUATED': return <MapPin className="w-4 h-4 text-blue-400" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SAFE': return 'bg-green-500/15 text-green-400 border-green-500/30';
      case 'NEEDS_HELP': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'INJURED': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'EVACUATED': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default: return 'bg-white/8 text-slate-400 border-white/15';
    }
  };

  const handleOverrideSave = async (memberId: string) => {
    setSavingOverride(true);
    try {
      await api.patch(`/family/admin/members/${memberId}`, { status: overrideStatus, notes: overrideNotes });
      showToast('Member status updated', 'success');
      setOverridingMember(null);
      await fetchRoster();
    } catch {
      showToast('Failed to update member status', 'error');
    } finally {
      setSavingOverride(false);
    }
  };

  const MEMBER_STATUSES = ['SAFE', 'NEEDS_HELP', 'INJURED', 'EVACUATED', 'TRAPPED', 'MISSING'];

  const FILTERS = [
    { key: 'ALL', label: t('family_safety_page.filters.all_citizens') },
    { key: 'NEEDS_ATTENTION', label: t('family_safety_page.filters.needs_attention') },
    { key: 'SAFE', label: t('family_safety_page.filters.safe') },
    { key: 'EVACUATED', label: t('family_safety_page.filters.evacuated') },
    { key: 'UNKNOWN', label: t('family_safety_page.filters.not_checked_in') },
  ];

  const STAT_CARDS = [
    { label: t('family_safety_page.stats.total_tracked'), value: stats.total, icon: Users, iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400' },
    { label: t('family_safety_page.stats.safe'), value: stats.safe, icon: ShieldCheck, iconBg: 'bg-green-500/15', iconColor: 'text-green-400' },
    { label: t('family_safety_page.stats.needs_attention'), value: stats.needsHelp, icon: ShieldAlert, iconBg: 'bg-red-500/15', iconColor: 'text-red-400' },
    { label: t('family_safety_page.stats.evacuated'), value: stats.evacuated, icon: MapPin, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
    { label: t('family_safety_page.stats.unknown_silent'), value: stats.unknown, icon: HelpCircle, iconBg: 'bg-white/8', iconColor: 'text-slate-400' },
  ];

  if (isCitizen) {
    return (
      <>
        <PageMeta title="Family Safety | Suraksha" description="Suraksha Family Safety Page" />
        <PageBreadcrumb pageTitle="Family Safety" />
        <CitizenFamilySafety />
      </>
    )
  }

  return (
    <>
      <PageMeta title="Family Safety | Suraksha" description="Suraksha Family Safety Page" />
      <PageBreadcrumb pageTitle={t('family_safety_page.page_title')} />
      <div className="space-y-8 animate-in fade-in duration-500 pb-10 w-full min-w-0">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map(card => (
            <div key={card.label} className="suraksha-card p-5 rounded-2xl flex items-center gap-4">
              <div className={cn('p-3 rounded-xl shrink-0', card.iconBg)}>
                <card.icon className={cn('w-5 h-5', card.iconColor)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white/90 mt-0.5">{loading ? '—' : card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl border border-slate-200 dark:border-cyan-400/10">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                filter === f.key
                  ? 'bg-brand-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="suraksha-card rounded-2xl overflow-hidden w-full min-w-0">
            {/* Table header */}
            <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-[#0e1d36]">
              <h2 className="text-lg font-black text-slate-800 dark:text-white/90">{t('family_safety_page.table_title')}</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('family_safety_page.search_placeholder')}
                  className="suraksha-input w-full pl-11 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-[#0e1d36] border-b border-slate-200 dark:border-white/10 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-5 py-4">{t('family_safety_page.citizen')}</th>
                    <th className="px-5 py-4">{t('family_safety_page.contact')}</th>
                    <th className="px-5 py-4">{t('family_safety_page.status')}</th>
                    <th className="px-5 py-4">{t('family_safety_page.family_members')}</th>
                    <th className="px-5 py-4">{t('family_safety_page.last_updated')}</th>
                    <th className="px-3 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold">{t('family_safety_page.loading')}</td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold">
                        {search ? t('family_safety_page.no_results', { search }) : t('family_safety_page.no_citizens')}
                      </td>
                    </tr>
                  ) : filteredRoster.map(user => {
                    const checkIn = user.latestCheckIn;
                    const status = checkIn?.status || 'UNKNOWN';
                    const isSelected = selectedUser?.userId === user.userId;
                    return (
                      <tr
                        key={user.userId}
                        onClick={() => setSelectedUser(isSelected ? null : user)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected ? 'bg-slate-100 dark:bg-white/8' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        )}
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-800 dark:text-white/90 whitespace-nowrap">{user.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-400">{user.phone || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase border whitespace-nowrap', getStatusBadge(status))}>
                              {status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {user.familyMembers.length === 0 ? (
                            <span className="text-sm text-slate-500">{t('family_safety_page.none')}</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {user.familyMembers.slice(0, 2).map((m: any) => (
                                <div key={m.id} className="flex items-center gap-2 text-sm">
                                  <span className={cn('w-2 h-2 rounded-full shrink-0', m.status === 'SAFE' ? 'bg-green-400' : 'bg-red-400')} />
                                  <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[120px]">{m.name}</span>
                                </div>
                              ))}
                              {user.familyMembers.length > 2 && (
                                <span className="text-xs text-slate-500">+{user.familyMembers.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            {checkIn ? format(new Date(checkIn.createdAt), 'MMM d, h:mm a') : t('family_safety_page.never')}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <ChevronRight className={cn('w-4 h-4 transition-all', isSelected ? 'text-cyan-400 rotate-90' : 'text-slate-600')} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        {/* Detail modal — backdrop + centered card, no layout shift */}
        {selectedUser && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-8 py-5 bg-slate-100 dark:bg-[#0e1d36] border-b-2 border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white/90">{selectedUser.name}</h3>
                  {selectedUser.phone && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedUser.phone}</p>}
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Primary status */}
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('family_safety_page.primary_status')}</p>
                  {selectedUser.latestCheckIn ? (
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedUser.latestCheckIn.status)}
                        <span className={cn('text-xs font-black px-2.5 py-1 rounded-full uppercase border', getStatusBadge(selectedUser.latestCheckIn.status))}>
                          {selectedUser.latestCheckIn.status.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedUser.latestCheckIn.message && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{selectedUser.latestCheckIn.message}"</p>
                      )}
                      {selectedUser.latestCheckIn.latitude && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          {selectedUser.latestCheckIn.latitude.toFixed(5)}, {selectedUser.latestCheckIn.longitude.toFixed(5)}
                        </div>
                      )}
                      <p className="text-xs text-slate-500">
                        Updated {format(new Date(selectedUser.latestCheckIn.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                      <HelpCircle className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto mb-1" />
                      <p className="text-sm text-slate-500 font-bold">{t('family_safety_page.no_checkin')}</p>
                    </div>
                  )}
                </div>

                {/* Family members */}
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    {t('family_safety_page.family_members_count', { count: selectedUser.familyMembers.length })}
                  </p>
                  {selectedUser.familyMembers.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('family_safety_page.no_family_members')}</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.familyMembers.map((m: any) => (
                        <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white/90">{m.name}</p>
                              <p className="text-xs text-slate-500">{m.relation}{m.age ? ` · ${m.age}y` : ''}{m.phone ? ` · ${m.phone}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[10px] font-black px-2.5 py-1 rounded-full uppercase border', getStatusBadge(m.status))}>
                                {(m.status || 'UNKNOWN').replace('_', ' ')}
                              </span>
                              <button
                                onClick={() => {
                                  if (overridingMember === m.id) {
                                    setOverridingMember(null);
                                  } else {
                                    setOverridingMember(m.id);
                                    setOverrideStatus(m.status || 'SAFE');
                                    setOverrideNotes(m.notes || '');
                                  }
                                }}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                              >
                                Override
                              </button>
                            </div>
                          </div>
                          {overridingMember === m.id && (
                            <div className="bg-slate-100 dark:bg-[#0e1d36] border border-slate-200 dark:border-cyan-400/15 rounded-xl p-3 space-y-2 mt-1">
                              <select
                                value={overrideStatus}
                                onChange={e => setOverrideStatus(e.target.value)}
                                className="suraksha-input w-full text-sm"
                              >
                                {MEMBER_STATUSES.map(s => (
                                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={overrideNotes}
                                onChange={e => setOverrideNotes(e.target.value)}
                                placeholder="Admin notes (optional)"
                                className="suraksha-input w-full text-sm"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOverrideSave(m.id)}
                                  disabled={savingOverride}
                                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                  {savingOverride ? 'Saving…' : 'Save Override'}
                                </button>
                                <button
                                  onClick={() => setOverridingMember(null)}
                                  className="px-3 py-2 text-slate-400 hover:text-white text-xs font-bold rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alert banner */}
                {selectedUser.familyMembers.some((m: any) => ['NEEDS_HELP', 'INJURED', 'TRAPPED'].includes(m.status)) && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-300">{t('family_safety_page.family_attention')}</p>
                      <p className="text-xs text-red-400/70 mt-0.5">
                        {selectedUser.familyMembers.filter((m: any) => ['NEEDS_HELP', 'INJURED', 'TRAPPED'].includes(m.status)).map((m: any) => m.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-8 right-8 z-[9999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
          toast.type === 'success' ? "bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg" :
          toast.type === 'error' ? "bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg" :
          "bg-white dark:bg-[#131f33] text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg"
        )}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </>
  );
};
