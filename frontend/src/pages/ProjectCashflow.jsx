import React, { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, CalendarDays, Compass, CreditCard, RefreshCcw, Save, Upload, Wallet } from 'lucide-react'
import api from '../services/api'

const paymentMethods = ['Not Provided', 'EVC Plus', 'E-Dahab', 'Bank', 'Cash', 'Other']

export default function ProjectCashflow() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [movementType, setMovementType] = useState('deposit')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Not Provided')
  const [reference, setReference] = useState('')
  const [person, setPerson] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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
      setNotice({ type: 'warning', text: 'Could not load projects. Make sure the backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find((project) => String(project.id) === String(projectId))
  const isWithdraw = movementType === 'withdraw'
  const numericAmount = Number(amount || 0)

  const previewBalance = useMemo(() => {
    if (!selectedProject) return 0
    const current = Number(selectedProject.cash_balance || 0)
    return isWithdraw ? current - numericAmount : current + numericAmount
  }, [selectedProject, isWithdraw, numericAmount])

  const saveMovement = async () => {
    setSaving(true)
    setNotice(null)

    try {
      if (!projectId) {
        setNotice({ type: 'warning', text: 'Please select a project first.' })
        setSaving(false)
        return
      }

      if (selectedProject?.status === 'completed') {
        setNotice({ type: 'warning', text: 'This project is completed. Deposit/withdraw entries are blocked.' })
        setSaving(false)
        return
      }

      if (numericAmount <= 0) {
        setNotice({ type: 'warning', text: 'Please enter an amount greater than zero.' })
        setSaving(false)
        return
      }

      const transaction = {
        type: isWithdraw ? 'expense' : 'income',
        category: isWithdraw ? 'withdrawal' : 'deposit',
        description: description.trim() || (isWithdraw ? 'Project withdrawal' : 'Project deposit'),
        quantity: null,
        unit_price: null,
        amount: numericAmount,
        currency: 'USD',
        payment_method: paymentMethod,
        payment_reference: reference || null,
        paid_to: isWithdraw ? (person || null) : null,
        paid_by: isWithdraw ? null : (person || null),
        needs_review: false,
        calculation_error: false,
        review_reason: null,
      }

      const formData = new FormData()
      formData.append('project_id', Number(projectId))
      formData.append('report_date', date)
      formData.append('raw_message', `${movementType} ${numericAmount} for ${selectedProject?.project_name || 'project'}`)
      formData.append('payment_method', paymentMethod)
      formData.append('provided_total', numericAmount)
      formData.append('calculated_total', numericAmount)
      formData.append('difference', 0)
      formData.append('total_status', 'matched')

      Object.entries(transaction).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(`transactions[0][${key}]`, typeof value === 'boolean' ? (value ? '1' : '0') : value)
        }
      })

      attachments.forEach((file) => formData.append('attachments[]', file))

      const { data } = await api.post('/daily-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setNotice({ type: 'success', text: `${isWithdraw ? 'Withdrawal' : 'Deposit'} saved in report #${data.id}.` })
      setAmount('')
      setReference('')
      setPerson('')
      setDescription('')
      setAttachments([])
      await loadProjects()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: error?.response?.data?.message || 'Could not save deposit/withdraw entry.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <Wallet size={14} />
              Deposit / Withdraw
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">Project Cash Movement</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Record project deposits as income and withdrawals as expenses. Totals update the project financial balance.
            </p>
          </div>
          <button onClick={loadProjects} className="btn bg-white/10 text-white hover:bg-white/20">
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      {notice && (
        <div className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
          {notice.text}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-5 p-6 lg:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Project" icon={Compass}>
              <select className="input" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
              </select>
            </Field>
            <Field label="Date" icon={CalendarDays}>
              <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Movement" icon={Wallet}>
              <select className="input" value={movementType} onChange={(event) => setMovementType(event.target.value)}>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
              </select>
            </Field>
            <Field label="Amount" icon={BadgeDollarSign}>
              <input className="input" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Payment Method" icon={CreditCard}>
              <select className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethods.map((method) => <option key={method}>{method}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={isWithdraw ? 'Paid To' : 'Paid By'} icon={CreditCard}>
              <input className="input" value={person} onChange={(event) => setPerson(event.target.value)} placeholder={isWithdraw ? 'Supplier / worker name' : 'Client / funding source'} />
            </Field>
            <Field label="Reference" icon={CreditCard}>
              <input className="input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt, transaction ID, or note" />
            </Field>
          </div>

          <Field label="Description" icon={Wallet}>
            <textarea className="input min-h-24 py-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short note for this deposit or withdrawal..." />
          </Field>

          <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50/30 p-5 text-center transition hover:border-cyan-300 hover:bg-cyan-50/30">
            <Upload className="mx-auto text-slate-400" size={22} />
            <p className="mt-2 text-sm font-extrabold text-slate-700">Attach Receipts / Proof</p>
            <p className="mt-1 text-xs text-slate-400">Upload one or more images or PDFs.</p>
            <input type="file" multiple accept="image/*,application/pdf" onChange={(event) => setAttachments(Array.from(event.target.files || []))} className="hidden" />
          </label>

          {attachments.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs font-semibold text-slate-600">
              {attachments.length} file{attachments.length === 1 ? '' : 's'} selected
            </div>
          )}

          <button type="button" onClick={saveMovement} disabled={saving} className="btn btn-primary w-full">
            <Save size={18} />
            {saving ? 'Saving...' : `Save ${isWithdraw ? 'Withdrawal' : 'Deposit'}`}
          </button>
        </div>

        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-black text-slate-900">Project Calculation</h3>
          <Metric label="Deposits" value={selectedProject?.income_amount || 0} color="text-emerald-700" />
          <Metric label="Withdrawals / Spent" value={selectedProject?.spent_amount || 0} color="text-rose-700" />
          <Metric label="Cash Balance" value={selectedProject?.cash_balance || 0} color="text-cyan-700" />
          <Metric label="After This Entry" value={previewBalance} color={previewBalance < 0 ? 'text-rose-700' : 'text-slate-950'} />
        </div>
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

function Metric({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
  )
}
