import React, { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  CalendarDays,
  Compass,
  CreditCard,
  FileText,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import api from '../services/api'

const emptyLine = () => ({
  type: 'expense',
  category: 'material',
  description: '',
  quantity: '',
  unit_price: '',
  amount: '',
  payment_method: 'Not Provided',
  paid_to: '',
  paid_by: '',
  payment_reference: '',
})

const categories = ['labor', 'material', 'equipment', 'transport', 'fuel', 'food', 'design', 'furniture', 'other']
const paymentMethods = ['Not Provided', 'EVC Plus', 'E-Dahab', 'Bank', 'Cash', 'Other']

export default function ManualReport() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState([emptyLine()])
  const [attachments, setAttachments] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const { data } = await api.get('/projects')
      setProjects(data || [])
      setProjectId('')
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: 'Could not load projects. Make sure the Laravel backend is running.' })
    } finally {
      setLoadingProjects(false)
    }
  }

  const selectedProject = projects.find((project) => String(project.id) === String(projectId))
  const selectedProjectCompleted = selectedProject?.status === 'completed'

  const total = useMemo(() => {
    return Number(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2))
  }, [lines])

  const updateLine = (index, field, value) => {
    setLines((previous) => previous.map((line, lineIndex) => {
      if (lineIndex !== index) return line

      const next = { ...line, [field]: value }
      const quantity = Number(field === 'quantity' ? value : next.quantity)
      const unitPrice = Number(field === 'unit_price' ? value : next.unit_price)

      if ((field === 'quantity' || field === 'unit_price') && quantity > 0 && unitPrice > 0) {
        next.amount = Number((quantity * unitPrice).toFixed(2)).toString()
      }

      return next
    }))
  }

  const addLine = () => setLines((previous) => [...previous, emptyLine()])

  const removeLine = (index) => {
    setLines((previous) => previous.length === 1 ? previous : previous.filter((_, lineIndex) => lineIndex !== index))
  }

  const saveManualReport = async () => {
    setSaving(true)
    setNotice(null)

    try {
      if (!projectId) {
        setNotice({ type: 'warning', text: 'Please select a project first.' })
        setSaving(false)
        return
      }

      if (selectedProjectCompleted) {
        setNotice({ type: 'warning', text: 'This project is completed. You cannot add a new manual report to it.' })
        setSaving(false)
        return
      }

      const transactions = lines
        .map((line) => ({
          type: line.type || 'expense',
          category: line.category || 'other',
          description: line.description.trim(),
          quantity: line.quantity === '' ? null : Number(line.quantity),
          unit_price: line.unit_price === '' ? null : Number(line.unit_price),
          amount: Number(line.amount || 0),
          currency: 'USD',
          payment_method: line.payment_method || 'Not Provided',
          payment_reference: line.payment_reference || null,
          paid_to: line.paid_to || null,
          paid_by: line.paid_by || null,
          needs_review: false,
          calculation_error: false,
          review_reason: null,
        }))
        .filter((line) => line.description && line.amount > 0)

      if (transactions.length === 0) {
        setNotice({ type: 'warning', text: 'Please add at least one valid transaction with description and amount.' })
        setSaving(false)
        return
      }

      const formData = new FormData()
      formData.append('project_id', Number(projectId))
      formData.append('report_date', reportDate)
      formData.append('raw_message', `Manual finance entry created on ${reportDate}`)
      formData.append('payment_method', 'Manual Entry')
      formData.append('calculated_total', total)
      formData.append('provided_total', total)
      formData.append('difference', 0)
      formData.append('total_status', 'matched')

      transactions.forEach((transaction, index) => {
        Object.entries(transaction).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(`transactions[${index}][${key}]`, typeof value === 'boolean' ? (value ? '1' : '0') : value)
          }
        })
      })

      attachments.forEach((file) => formData.append('attachments[]', file))

      const { data } = await api.post('/daily-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setNotice({
        type: 'success',
        text: `Manual report #${data.id} saved with ${data.transactions?.length || 0} transaction(s).`,
      })
      setLines([emptyLine()])
      setAttachments([])
      await loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text: error?.response?.data?.message || 'Could not save manual report. Check the backend and required fields.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
            <FileText size={14} />
            Manual Finance Entry
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">Manual Report</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Finance users can add transactions manually, attach invoices or payment screenshots, and save them into the same monthly report archive.
          </p>
        </div>
      </section>

      <section className="card space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Project" icon={Compass}>
            <select className="input" value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={loadingProjects}>
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
            </select>
          </Field>
          <Field label="Report Date" icon={CalendarDays}>
            <input className="input" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
          </Field>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase text-cyan-700">Manual Total</p>
            <p className="mt-2 text-2xl font-black text-slate-950">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {selectedProjectCompleted && (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm font-extrabold text-rose-700 ring-1 ring-inset ring-rose-600/10">
            This project is completed. Manual report entry is blocked.
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Transaction Lines</h3>
            <p className="text-xs text-slate-400">Add one or more expenses or income lines.</p>
          </div>
          <button type="button" onClick={addLine} className="btn btn-light">
            <Plus size={16} />
            Add Line
          </button>
        </div>

        <div className="space-y-4 p-6">
          {lines.map((line, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-12">
                <select className="input md:col-span-2" value={line.type} onChange={(event) => updateLine(index, 'type', event.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <select className="input md:col-span-2" value={line.category} onChange={(event) => updateLine(index, 'category', event.target.value)}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <input className="input md:col-span-4" value={line.description} onChange={(event) => updateLine(index, 'description', event.target.value)} placeholder="Description" />
                <input className="input md:col-span-1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} placeholder="Qty" type="number" min="0" step="0.01" />
                <input className="input md:col-span-1" value={line.unit_price} onChange={(event) => updateLine(index, 'unit_price', event.target.value)} placeholder="Rate" type="number" min="0" step="0.01" />
                <input className="input md:col-span-2" value={line.amount} onChange={(event) => updateLine(index, 'amount', event.target.value)} placeholder="Amount" type="number" min="0" step="0.01" />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-12">
                <select className="input md:col-span-3" value={line.payment_method} onChange={(event) => updateLine(index, 'payment_method', event.target.value)}>
                  {paymentMethods.map((method) => <option key={method}>{method}</option>)}
                </select>
                <input className="input md:col-span-3" value={line.paid_to} onChange={(event) => updateLine(index, 'paid_to', event.target.value)} placeholder="Paid to" />
                <input className="input md:col-span-3" value={line.paid_by} onChange={(event) => updateLine(index, 'paid_by', event.target.value)} placeholder="Paid by" />
                <input className="input md:col-span-2" value={line.payment_reference} onChange={(event) => updateLine(index, 'payment_reference', event.target.value)} placeholder="Reference" />
                <button type="button" onClick={() => removeLine(index)} className="btn btn-light text-rose-600 md:col-span-1" disabled={lines.length === 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50/30 p-5 text-center transition hover:border-cyan-300 hover:bg-cyan-50/30">
          <Upload className="mx-auto text-slate-400" size={22} />
          <p className="mt-2 text-sm font-extrabold text-slate-700">Attach Invoices / Receipts</p>
          <p className="mt-1 text-xs text-slate-400">Upload one or more PDFs, receipt images, or payment screenshots.</p>
          <input type="file" multiple accept="image/*,application/pdf" onChange={(event) => setAttachments(Array.from(event.target.files || []))} className="hidden" />
        </label>

        {attachments.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-black text-slate-700">{attachments.length} file{attachments.length === 1 ? '' : 's'} selected</p>
            <div className="mt-3 space-y-2">
              {attachments.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 pl-3 text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {notice && (
          <div className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
            {notice.text}
          </div>
        )}

        <button type="button" onClick={saveManualReport} disabled={saving || selectedProjectCompleted} className="btn btn-primary w-full">
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Manual Report'}
        </button>
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
