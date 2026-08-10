import { useEffect, useState } from 'react'
import {
  ClipboardList, Plus, X, Loader2, CheckCircle2, Clock,
  AlertTriangle, User, MapPin, Calendar, ChevronDown, RefreshCw,
  Play, Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { volunteerService, userService, incidentService } from '../services/api'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import PageMeta from '@/components/common/PageMeta'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'EN_ROUTE' | 'ON_SITE' | 'RESOLVED'

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  createdAt: string
  dueDate?: string
  assignedTo?: { id: string; name: string; email: string }
  assignedBy?: { id: string; name: string }
  incident?: { id: string; category: string; location: string }
}

interface Volunteer {
  id: string
  name: string
  email: string
  role: string
}

interface Incident {
  id: string
  category: string
  location: string
  status: string
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: 'Pending',     color: '#D97706', bg: '#FEF3C7', icon: Clock },
  ASSIGNED:    { label: 'Assigned',    color: '#7C3AED', bg: '#EDE9FE', icon: User },
  IN_PROGRESS: { label: 'In Progress', color: '#2563EB', bg: '#DBEAFE', icon: Play },
  EN_ROUTE:    { label: 'En Route',    color: '#0891B2', bg: '#CFFAFE', icon: MapPin },
  ON_SITE:     { label: 'On Site',     color: '#0F766E', bg: '#CCFBF1', icon: MapPin },
  RESOLVED:    { label: 'Resolved',    color: '#059669', bg: '#D1FAE5', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW:      { label: 'Low',      color: '#64748B', bg: '#F1F5F9' },
  MEDIUM:   { label: 'Medium',   color: '#D97706', bg: '#FEF3C7' },
  HIGH:     { label: 'High',     color: '#EA580C', bg: '#FFEDD5' },
  CRITICAL: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2' },
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-700"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Flag className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL')
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    assignedToId: '',
    incidentId: '',
    dueDate: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = async () => {
    setLoading(true)

    // Fetch tasks
    try {
      const r = await volunteerService.getAllTasks()
      setTasks(Array.isArray(r.data) ? r.data : [])
    } catch (e) {
      console.error('[Tasks] getAllTasks error:', e)
    }

    // Fetch users (volunteers/officers) — independent, never silenced
    try {
      const r = await userService.getUsers()
      const all: any[] = Array.isArray(r.data) ? r.data : []
      const assignable = all.filter(u => u.role === 'VOLUNTEER' || u.role === 'DMC_OFFICER' || u.role === 'ADMIN')
      setVolunteers(assignable)
    } catch (e: any) {
      console.error('[Tasks] getUsers error:', e?.response?.status, e?.response?.data || e?.message)
      showToast('Could not load volunteers: ' + (e?.response?.data?.message || e?.message), 'error')
    }

    // Fetch incidents
    try {
      const r = await incidentService.getIncidents()
      setIncidents(Array.isArray(r.data) ? r.data : [])
    } catch (e) {
      console.error('[Tasks] getIncidents error:', e)
    }

    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Task title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.assignedToId) e.assignedToId = 'Please assign to a volunteer'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assignedToId: form.assignedToId,
      }
      if (form.incidentId) payload.incidentId = form.incidentId
      if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString()

      const res = await volunteerService.createTask(payload)
      console.log('[Tasks] created:', res.data)
      showToast('Task created and assigned successfully')
      setForm({ title: '', description: '', priority: 'MEDIUM', assignedToId: '', incidentId: '', dueDate: '' })
      setShowForm(false)
      fetchAll()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create task'
      console.error('[Tasks] createTask error:', err?.response?.status, err?.response?.data)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setUpdatingId(taskId)
    try {
      await volunteerService.updateTaskStatus(taskId, status)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      showToast('Status updated')
    } catch {
      showToast('Failed to update status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
    return true
  })

  const counts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length,
    active: tasks.filter(t => ['IN_PROGRESS', 'EN_ROUTE', 'ON_SITE'].includes(t.status)).length,
    resolved: tasks.filter(t => t.status === 'RESOLVED').length,
  }

  return (
    <>
      <PageMeta title="Task Management | Suraksha" description="Assign and manage volunteer tasks" />
      <PageBreadcrumb pageTitle="Task Management" />

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all',
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Tasks',  value: counts.total,    icon: ClipboardList, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Pending',      value: counts.pending,  icon: Clock,         color: '#D97706', bg: '#FFFBEB' },
            { label: 'Active',       value: counts.active,   icon: Play,          color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Resolved',     value: counts.resolved, icon: CheckCircle2,  color: '#059669', bg: '#ECFDF5' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
            >
              <option value="ALL">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as any)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
            >
              <option value="ALL">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Assign New Task
          </button>
        </div>

        {/* Create Task Modal */}
        {showForm && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowForm(false)}>
            <div
              className="bg-white dark:bg-[#131f33] border border-cyan-400/20 w-full max-w-xl rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header — sticky */}
              <div className="flex-shrink-0 px-8 py-6 border-b border-slate-200 dark:border-cyan-400/20 flex items-center justify-between bg-slate-50 dark:bg-[#0f172a]">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white/90">Assign New Task</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Create and assign a task to a volunteer</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-cyan-400/70 hover:text-cyan-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-8 space-y-5">

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Task Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Distribute relief packs at Galle camp"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={cn('suraksha-input', formErrors.title && 'border-red-500/60 focus:border-red-500/60')}
                  />
                  {formErrors.title && <p className="text-red-400 text-xs px-1">{formErrors.title}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Description *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what the volunteer needs to do..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={cn('suraksha-input h-auto py-3 resize-none', formErrors.description && 'border-red-500/60')}
                  />
                  {formErrors.description && <p className="text-red-400 text-xs px-1">{formErrors.description}</p>}
                </div>

                {/* Priority + Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="suraksha-input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                      className="suraksha-input cursor-pointer"
                    />
                  </div>
                </div>

                {/* Assign to volunteer */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Assign To *</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                    className={cn('suraksha-input', formErrors.assignedToId && 'border-red-500/60')}
                  >
                    <option value="">Select volunteer...</option>
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.role})</option>
                    ))}
                  </select>
                  {formErrors.assignedToId && <p className="text-red-400 text-xs px-1">{formErrors.assignedToId}</p>}
                </div>

                {/* Link to incident */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                    Link to Incident <span className="text-slate-500 normal-case font-normal">(optional)</span>
                  </label>
                  <select
                    value={form.incidentId}
                    onChange={e => setForm(f => ({ ...f, incidentId: e.target.value }))}
                    className="suraksha-input"
                  >
                    <option value="">No incident linked</option>
                    {incidents.filter(i => i.status !== 'RESOLVED').map(i => (
                      <option key={i.id} value={i.id}>{i.category} — {i.location}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 text-slate-600 dark:text-cyan-400/70 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-cyan-900/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {submitting ? 'Creating…' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white">
              {filtered.length} {filterStatus === 'ALL' ? 'Total' : STATUS_CONFIG[filterStatus as TaskStatus]?.label} Task{filtered.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">No tasks found</p>
              <p className="text-sm mt-1">Create a task using the button above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(task => (
                <div key={task.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: task info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{task.title}</h4>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>

                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-semibold text-gray-600 dark:text-gray-300">{task.assignedTo.name}</span>
                          </span>
                        )}
                        {task.incident && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {task.incident.category} — {task.incident.location}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Right: status control */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          disabled={updatingId === task.id || task.status === 'RESOLVED'}
                          className={cn(
                            'appearance-none text-xs font-bold border rounded-lg px-3 py-1.5 pr-7 cursor-pointer disabled:opacity-50 disabled:cursor-default',
                            'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                          )}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {updatingId === task.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-700/70 rounded-lg">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
