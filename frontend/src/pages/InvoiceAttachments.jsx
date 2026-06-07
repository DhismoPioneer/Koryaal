import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Compass,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Paperclip,
  RefreshCcw,
  Search,
} from 'lucide-react'
import api from '../services/api'

export default function InvoiceAttachments() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => {
        setProjects(data || [])
        setProjectId('')
      })
      .catch((error) => {
        console.error(error)
        setProjects([])
        setNotice({
          type: 'warning',
          text: 'Could not load projects. Make sure the Laravel backend is running.',
        })
      })
  }, [])

  useEffect(() => {
    setData(null)

    if (projectId && month) {
      loadAttachments(projectId, month)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, month])

  const loadAttachments = async (selectedProjectId = projectId, selectedMonth = month) => {
    if (!selectedProjectId) {
      setNotice({ type: 'warning', text: 'Please select a project first.' })
      return
    }

    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.get('/reports/monthly', {
        params: { project_id: selectedProjectId, month: selectedMonth },
      })
      setData(data)

      const count = getAttachments(data).length
      setNotice({
        type: count > 0 ? 'success' : 'warning',
        text: count > 0
          ? `Loaded ${count} saved invoice/receipt file${count === 1 ? '' : 's'}.`
          : 'No saved invoice or receipt files found for this project and month.',
      })
    } catch (error) {
      console.error(error)
      setData(null)
      setNotice({ type: 'warning', text: 'Could not load invoice files. Make sure the backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  const attachments = getAttachments(data)

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
            <Paperclip size={14} />
            Invoice Archive
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
            Saved Receipts & Invoices
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            View uploaded invoice PDFs, receipt images, and payment screenshots by project and month.
          </p>
        </div>
      </section>

      <section className="card space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Project" icon={Compass}>
            <div className="relative">
              <select
                className="input appearance-none pr-10"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value)
                  setData(null)
                  setNotice(null)
                }}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.project_name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">?</span>
            </div>
          </Field>

          <Field label="Month" icon={Calendar}>
            <input
              className="input font-semibold text-slate-800"
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value)
                setData(null)
              }}
            />
          </Field>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => loadAttachments()}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? <RefreshCcw size={17} className="animate-spin" /> : <Search size={17} />}
              {loading ? 'Loading...' : 'Load Invoices'}
            </button>
          </div>
        </div>

        {notice && (
          <div className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
            {notice.text}
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <Paperclip size={20} className="text-cyan-600" />
                Invoice Files
              </h3>
              <p className="text-xs text-slate-400">Click any item to open the saved file.</p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
              {attachments.length} files
            </span>
          </div>
        </div>

        {attachments.length > 0 ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg"
              >
                <div className="flex aspect-video items-center justify-center overflow-hidden bg-slate-100">
                  {attachment.is_image ? (
                    <img
                      src={attachment.file_url}
                      alt={attachment.original_name || 'Uploaded invoice'}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={36} />
                      <span className="text-xs font-black uppercase">PDF / Document</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {attachment.original_name || 'Uploaded invoice'}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Report #{attachment.daily_report_id} • {formatDate(attachment.report_date)}
                      </p>
                    </div>
                    <ExternalLink size={16} className="shrink-0 text-slate-400 group-hover:text-cyan-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-600">
                      {attachment.file_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-cyan-700">
                      {attachment.is_image ? <ImageIcon size={12} /> : <FileText size={12} />}
                      Open
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center font-bold text-slate-400">
            Select a project and month to view saved invoice images and PDFs.
          </div>
        )}
      </section>
    </div>
  )
}

function getAttachments(data) {
  return (data?.reports || []).flatMap((report) =>
    (report.attachments || []).map((attachment) => ({ ...attachment, report_date: report.report_date }))
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

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  const cleanStr = String(dateValue).slice(0, 10)
  const parts = cleanStr.split('-')
  if (parts.length !== 3) return cleanStr
  const [year, month, day] = parts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mIdx = parseInt(month, 10) - 1
  if (mIdx < 0 || mIdx > 11) return cleanStr
  return `${months[mIdx]} ${parseInt(day, 10)}, ${year}`
}
