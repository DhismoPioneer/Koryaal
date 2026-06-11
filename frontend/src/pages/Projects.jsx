import React, { useEffect, useMemo, useState } from 'react'
import {
  FolderKanban,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCcw,
  Pencil,
  X,
  Save,
  MapPin,
  Calendar,
  DollarSign,
  ChevronDown,
  FileText,
} from 'lucide-react'
import api from '../services/api'

export default function Projects({ authUser }) {
  const role = authUser?.role || 'client'
  const fallbackPermissions = {
    admin: ['projects.view', 'projects.manage', 'projects.complete', 'finance.view'],
    finance: ['projects.view', 'finance.view'],
    engineer: ['projects.view', 'reports.create'],
    client: ['projects.view', 'client.progress.view'],
  }
  const permissions = authUser?.permissions || fallbackPermissions[role] || []
  const hasPermission = (permission) => role === 'admin' || permissions.includes(permission)
  const isClient = hasPermission('client.progress.view') && !hasPermission('projects.manage')
  const canManageProjects = hasPermission('projects.manage')
  const canCompleteProjects = hasPermission('projects.complete')
  const canViewFinancials = hasPermission('finance.view')
  const showProjectActions = canManageProjects || canCompleteProjects

  const emptyForm = {
    project_name: '',
    location: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    budget: '',
    status: 'in_progress',
    description: '',
  }

  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingProject, setEditingProject] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState('all')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.get('/projects')
      setProjects(data || [])
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text: 'Could not load projects. Make sure the Laravel backend is running.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const openNewProject = () => {
    if (!canManageProjects) return

    setEditingProject(null)
    setForm(emptyForm)
    setShowForm(true)
    setNotice(null)
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingProject(null)
    setShowForm(false)
  }

  const submitProject = async (e) => {
    e.preventDefault()

    if (!canManageProjects) {
      setNotice({
        type: 'warning',
        text: 'Only company admins can create or update projects.',
      })
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      if (!form.project_name.trim()) {
        setNotice({ type: 'warning', text: 'Project name is required.' })
        setSaving(false)
        return
      }

      const payload = {
        project_name: form.project_name,
        location: form.location || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget || 0,
        status: form.status || 'pending',
        description: form.description || null,
      }

      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, payload)
        setNotice({ type: 'success', text: 'Project updated successfully.' })
      } else {
        await api.post('/projects', payload)
        setNotice({ type: 'success', text: 'Project created successfully.' })
      }

      resetForm()
      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text:
          error?.response?.data?.message ||
          'Could not save project. Check backend validation or database.',
      })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (project) => {
    if (!canManageProjects) return

    setEditingProject(project)
    setShowForm(true)

    setForm({
      project_name: project.project_name || '',
      location: project.location || '',
      start_date: toDateInput(project.start_date),
      end_date: toDateInput(project.end_date),
      budget: project.budget || '',
      status: project.status || 'in_progress',
      description: project.description || '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const markComplete = async (project) => {
    if (!canManageProjects) return

    const today = new Date().toISOString().slice(0, 10)

    try {
      await api.patch(`/projects/${project.id}`, {
        status: 'completed',
        end_date: toDateInput(project.end_date) || today,
      })

      setNotice({
        type: 'success',
        text: `"${project.project_name}" marked as completed.`,
      })

      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: 'Could not complete project.' })
    }
  }

  const markInProgress = async (project) => {
    if (!canManageProjects) return

    try {
      await api.patch(`/projects/${project.id}`, {
        status: 'in_progress',
      })

      setNotice({
        type: 'success',
        text: `"${project.project_name}" moved to in progress.`,
      })

      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: 'Could not update project status.' })
    }
  }

  const deleteProject = async (project) => {
    if (!canManageProjects) return

    const ok = window.confirm(`Delete project: ${project.project_name}?`)
    if (!ok) return

    try {
      await api.delete(`/projects/${project.id}`)

      setNotice({
        type: 'success',
        text: 'Project deleted successfully.',
      })

      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text: 'Could not delete project. It may have reports/transactions linked.',
      })
    }
  }

  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === 'in_progress').length
  const completedProjects = projects.filter((p) => p.status === 'completed').length
  const delayedProjects = projects.filter((p) => p.status === 'delayed').length
  const overBudgetProjects = projects.filter((p) => p.budget_status === 'over_budget').length
  const delayedOrOverBudget = delayedProjects + overBudgetProjects

  const selectedProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects
    return projects.filter((project) => String(project.id) === String(selectedProjectId))
  }, [projects, selectedProjectId])

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Banner Header */}
      <section className="page-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />

        <div className="relative p-6 lg:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <FolderKanban size={14} />
              {isClient ? 'Project Progress' : 'Project Administration'}
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
              {isClient ? 'My Projects' : 'Project Hub'}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {isClient
                ? 'View assigned construction project progress, timeline, and delivery status.'
                : 'Initialize, budget, and oversee status and contract spending limits for all active project nodes.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadProjects}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-white/20 active:scale-95 transition"
            >
              <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
              : 'bg-amber-50 text-amber-700 ring-amber-600/10'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Stats Cards Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          colorClass="text-cyan-600"
          bgClass="bg-cyan-50"
        />
        <StatCard
          label="In Progress"
          value={activeProjects}
          icon={Clock}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <StatCard
          label="Completed"
          value={completedProjects}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          label="Delayed / Over budget"
          value={delayedOrOverBudget}
          icon={AlertTriangle}
          colorClass="text-rose-500"
          bgClass="bg-rose-50"
        />
      </section>

      {/* Input Form Section */}
      {canManageProjects && showForm && (
        <section className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {editingProject ? 'Edit Project Config' : 'Initialize New Project'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {editingProject ? 'Update current parameters.' : 'Add a new construction node.'}
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 transition"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={submitProject} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Project Name" icon={FolderKanban}>
                <input
                  name="project_name"
                  className="input"
                  value={form.project_name}
                  onChange={handleChange}
                  placeholder="e.g. Hodan Villa Project"
                />
              </Field>

              <Field label="Location" icon={MapPin}>
                <input
                  name="location"
                  className="input"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Hodan, Mogadishu"
                />
              </Field>

              <Field label="Project Budget ($)" icon={DollarSign}>
                <input
                  name="budget"
                  type="number"
                  className="input"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="50000"
                />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Start Date" icon={Calendar}>
                <input
                  name="start_date"
                  type="date"
                  className="input text-xs font-semibold text-slate-800"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </Field>

              <Field label="End Date" icon={Calendar}>
                <input
                  name="end_date"
                  type="date"
                  className="input text-xs font-semibold text-slate-800"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Status" icon={CheckCircle2}>
                <div className="relative">
                  <select
                    name="status"
                    className="input appearance-none pr-10"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed / Over Budget</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                    ?
                  </span>
                </div>
              </Field>
            </div>

            <Field label="Description Notes" icon={FileText}>
              <textarea
                name="description"
                className="input min-h-24 py-3"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description notes about timelines or contractor names..."
              />
            </Field>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-light"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                <Save size={17} />
                {saving ? 'Saving...' : editingProject ? 'Save Configuration' : 'Initialize Project'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Projects Table Card */}
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-6 bg-slate-50/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {isClient ? 'Assigned Project Progress' : 'Project Registries'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isClient
                ? 'Read-only status for projects assigned to your client account.'
                : 'Active construction nodes with real-time budget limits and validation controls.'}
            </p>
          </div>

          <div className="relative min-w-[200px]">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-3 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ?
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full table-fixed text-sm ${isClient ? 'min-w-[840px]' : 'min-w-[1180px]'}`}>
            {isClient ? (
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[160px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[180px]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[180px]" />
                <col className="w-[140px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[200px]" />
              </colgroup>
            )}

            <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
              <tr>
                <th className="p-4 text-left font-black tracking-wider text-[10px] uppercase">Project Name</th>
                <th className="p-4 text-left font-black tracking-wider text-[10px] uppercase">Location</th>
                {!isClient && (
                  <>
                {canViewFinancials && (
                  <>
                    <th className="p-4 text-right font-black tracking-wider text-[10px] uppercase">Budget</th>
                    <th className="p-4 text-right font-black tracking-wider text-[10px] uppercase">Spent</th>
                    <th className="p-4 text-right font-black tracking-wider text-[10px] uppercase">Remaining</th>
                  </>
                )}
                  </>
                )}
                <th className="p-4 text-center font-black tracking-wider text-[10px] uppercase">Start Date</th>
                <th className="p-4 text-center font-black tracking-wider text-[10px] uppercase">End Date</th>
                <th className="p-4 text-center font-black tracking-wider text-[10px] uppercase">Status</th>
                {!showProjectActions ? (
                  <th className="p-4 text-left font-black tracking-wider text-[10px] uppercase">Progress</th>
                ) : (
                <th className="p-4 text-right font-black tracking-wider text-[10px] uppercase">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {selectedProjects.map((project) => {
                const budget = Number(project.budget || 0)
                const spent = Number(project.spent_amount || 0)
                const remaining = Number(project.remaining_budget || 0)

                return (
                  <tr key={project.id} className="hover:bg-slate-50/30 transition">
                    <td className="p-4 font-extrabold text-slate-950 truncate" title={project.project_name}>
                      {project.project_name}
                    </td>
                    <td className="p-4 font-semibold text-slate-500 truncate" title={project.location}>
                      {project.location || 'No location set'}
                    </td>
                    {!isClient && canViewFinancials && (
                      <>
                    <td className="p-4 text-right font-bold text-slate-900">
                      ${Math.round(budget).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      ${Math.round(spent).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      ${Math.round(remaining).toLocaleString()}
                    </td>
                      </>
                    )}
                    <td className="p-4 text-center font-semibold text-slate-500 text-xs">
                      {formatDate(project.start_date)}
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-500 text-xs">
                      {formatDate(project.end_date)}
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={project.status} />
                    </td>
                    {!showProjectActions ? (
                    <td className="p-4">
                      <ProgressBar project={project} />
                    </td>
                    ) : (
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {canManageProjects && (
                        <button
                          onClick={() => startEdit(project)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
                          title="Edit project parameters"
                        >
                          <Pencil size={13} />
                        </button>
                        )}

                        {false && canCompleteProjects && (project.status !== 'completed' ? (
                          <button
                            onClick={() => markComplete(project)}
                            className="rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 transition ring-1 ring-emerald-500/10"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            onClick={() => markInProgress(project)}
                            className="rounded-lg bg-cyan-50 px-2.5 py-2 text-[11px] font-black text-cyan-700 hover:bg-cyan-100 transition ring-1 ring-cyan-500/10"
                          >
                            Reopen
                          </button>
                        ))}

                        {canManageProjects && (
                        <button
                          onClick={() => deleteProject(project)}
                          className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition ring-1 ring-rose-500/10"
                          title="Delete Project Node"
                        >
                          <Trash2 size={13} />
                        </button>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                )
              })}

              {selectedProjects.length === 0 && (
                <tr>
                  <td colSpan={isClient ? 6 : 9} className="p-12 text-center font-bold text-slate-400">
                    {isClient ? 'No assigned projects found.' : 'No project registries found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, colorClass, bgClass }) {
  return (
    <div className="card p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-200/50 flex items-center justify-between group">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="mt-2 text-3xl font-black text-slate-950 leading-none">
          {value}
        </p>
      </div>

      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition duration-300`}>
        <Icon size={22} />
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-500" />}
        {label}
      </label>
      {children}
    </div>
  )
}

function MoneyMini({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-[11px] font-black ${
          value < 0 ? 'text-rose-600' : 'text-slate-800'
        }`}
      >
        ${Number(value || 0).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  )
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  const cleanStr = String(dateValue).slice(0, 10)
  const parts = cleanStr.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const mIdx = parseInt(month, 10) - 1
    if (mIdx >= 0 && mIdx < 12) {
      const monthStr = months[mIdx]
      const dayVal = parseInt(day, 10)
      return `${monthStr} ${dayVal}, ${year}`
    }
  }
  return cleanStr
}

function toDateInput(dateValue) {
  if (!dateValue) return ''
  return String(dateValue).slice(0, 10)
}

function ProgressBar({ project }) {
  const percent = getProjectProgress(project)

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span>{percent}% complete</span>
        <span className="capitalize">{String(project.status || 'pending').replace('_', ' ')}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            project.status === 'completed'
              ? 'bg-emerald-500'
              : project.status === 'delayed'
                ? 'bg-rose-500'
                : 'bg-cyan-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function getProjectProgress(project) {
  if (project.status === 'completed') return 100
  if (project.status === 'pending') return 5

  const start = project.start_date ? new Date(String(project.start_date).slice(0, 10)) : null
  const end = project.end_date ? new Date(String(project.end_date).slice(0, 10)) : null
  const now = new Date()

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return project.status === 'delayed' ? 75 : 35
  }

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  const percent = Math.round((elapsed / total) * 100)

  return Math.max(5, Math.min(project.status === 'delayed' ? 95 : 98, percent))
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    in_progress: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    delayed: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  }

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

