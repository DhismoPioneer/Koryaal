import React, { useState } from 'react'
import { Calendar, CheckCircle2, DollarSign, FileText, FolderKanban, MapPin, Save, X } from 'lucide-react'
import api from '../services/api'

const emptyForm = {
  project_name: '',
  location: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  budget: '',
  status: 'in_progress',
  description: '',
}

export default function AddProject() {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const submitProject = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    try {
      if (!form.project_name.trim()) {
        setNotice({ type: 'warning', text: 'Project name is required.' })
        setSaving(false)
        return
      }

      await api.post('/projects', {
        project_name: form.project_name,
        location: form.location || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget || 0,
        status: form.status || 'pending',
        description: form.description || null,
      })

      setForm(emptyForm)
      setNotice({ type: 'success', text: 'Project created successfully.' })
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text: error?.response?.data?.message || 'Could not create project. Only admins can add projects.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="page-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
            <FolderKanban size={14} />
            Add Project
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">Create New Project</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Add a new construction project with budget, location, timeline, status, and notes.
          </p>
        </div>
      </section>

      {notice && (
        <div className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
          {notice.text}
        </div>
      )}

      <section className="card p-6">
        <form onSubmit={submitProject} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Project Name" icon={FolderKanban}>
              <input name="project_name" className="input" value={form.project_name} onChange={handleChange} placeholder="e.g. Hodan Villa Project" />
            </Field>
            <Field label="Location" icon={MapPin}>
              <input name="location" className="input" value={form.location} onChange={handleChange} placeholder="e.g. Hodan, Mogadishu" />
            </Field>
            <Field label="Budget ($)" icon={DollarSign}>
              <input name="budget" type="number" className="input" value={form.budget} onChange={handleChange} placeholder="50000" min="0" />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Start Date" icon={Calendar}>
              <input name="start_date" type="date" className="input" value={form.start_date} onChange={handleChange} />
            </Field>
            <Field label="End Date" icon={Calendar}>
              <input name="end_date" type="date" className="input" value={form.end_date} onChange={handleChange} />
            </Field>
            <Field label="Status" icon={CheckCircle2}>
              <select name="status" className="input" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </Field>
          </div>

          <Field label="Description" icon={FileText}>
            <textarea name="description" className="input min-h-28 py-3" value={form.description} onChange={handleChange} placeholder="Project notes, contractor name, scope, or timeline details..." />
          </Field>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setForm(emptyForm)} className="btn btn-light">
              <X size={17} />
              Clear
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={17} />
              {saving ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </form>
      </section>
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
