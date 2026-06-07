import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, FolderKanban, RefreshCcw, Search } from 'lucide-react'
import api from '../services/api'

export default function CompleteProjects() {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

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
      setNotice({ type: 'warning', text: 'Could not load projects. Make sure the Laravel backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects
    return projects.filter((project) => String(project.id) === String(selectedProjectId))
  }, [projects, selectedProjectId])

  const markComplete = async (project) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      await api.patch(`/projects/${project.id}`, {
        status: 'completed',
        end_date: project.end_date ? String(project.end_date).slice(0, 10) : today,
      })
      setNotice({ type: 'success', text: `${project.project_name} marked as completed.` })
      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: error?.response?.data?.message || 'Could not complete project.' })
    }
  }

  const reopenProject = async (project) => {
    try {
      await api.patch(`/projects/${project.id}`, { status: 'in_progress' })
      setNotice({ type: 'success', text: `${project.project_name} reopened to in progress.` })
      loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: error?.response?.data?.message || 'Could not reopen project.' })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <CheckCircle2 size={14} />
              Complete Project
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">Project Completion</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Select a project and mark it completed from this standalone completion screen.
            </p>
          </div>
          <button onClick={loadProjects} className="btn bg-white/10 text-white hover:bg-white/20">
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {notice && (
        <div className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
          {notice.text}
        </div>
      )}

      <section className="card p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="label flex items-center gap-1.5"><Search size={12} /> Select Project</label>
            <select className="input" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
              <option value="all">All Projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
            </select>
          </div>
          <div className="rounded-2xl bg-cyan-50 px-5 py-4 text-sm font-black text-cyan-700">
            {projects.filter((project) => project.status === 'completed').length} completed
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <h3 className="text-xl font-extrabold text-slate-900">Projects Ready For Status Update</h3>
          <p className="text-xs text-slate-400">Complete or reopen project status without editing other project information.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Project</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Location</th>
                <th className="p-4 text-center text-[10px] font-black uppercase tracking-wider">Status</th>
                <th className="p-4 text-center text-[10px] font-black uppercase tracking-wider">End Date</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/40">
                  <td className="p-4 font-black text-slate-950">{project.project_name}</td>
                  <td className="p-4 font-semibold text-slate-500">{project.location || 'No location set'}</td>
                  <td className="p-4 text-center"><StatusBadge status={project.status} /></td>
                  <td className="p-4 text-center text-xs font-semibold text-slate-500">{formatDate(project.end_date)}</td>
                  <td className="p-4 text-right">
                    {project.status === 'completed' ? (
                      <button onClick={() => reopenProject(project)} className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-500/10 hover:bg-cyan-100">
                        Reopen
                      </button>
                    ) : (
                      <button onClick={() => markComplete(project)} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-500/10 hover:bg-emerald-100">
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr><td colSpan="5" className="p-12 text-center font-bold text-slate-400">No projects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    in_progress: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    delayed: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${styles[status] || styles.pending}`}>{String(status || 'pending').replace('_', ' ')}</span>
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  return String(dateValue).slice(0, 10)
}
