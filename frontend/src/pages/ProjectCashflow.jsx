import React, { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, CalendarDays, Compass, CreditCard, FileSpreadsheet, RefreshCcw, Save, Search, Upload, Wallet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
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
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7))
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
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

  const cashflowRows = useMemo(() => {
    return (historyData?.reports || []).flatMap((report) =>
      (report.transactions || [])
        .filter((transaction) => ['deposit', 'withdrawal'].includes(String(transaction.category || '').toLowerCase()))
        .map((transaction) => ({
          reportId: report.id,
          date: report.report_date,
          projectName: report.project?.project_name || selectedProject?.project_name || '',
          movement: transaction.category === 'withdrawal' || transaction.type === 'expense' ? 'Withdrawal' : 'Deposit',
          description: transaction.description || '',
          amount: Number(transaction.amount || 0),
          paymentMethod: transaction.payment_method || report.payment_method || 'Not Provided',
          reference: transaction.payment_reference || '',
          person: transaction.paid_to || transaction.paid_by || '',
          review: transaction.needs_review ? 'Check' : 'OK',
        }))
    )
  }, [historyData, selectedProject])

  const previewBalance = useMemo(() => {
    if (!selectedProject) return 0
    const current = Number(selectedProject.cash_balance || 0)
    return isWithdraw ? current - numericAmount : current + numericAmount
  }, [selectedProject, isWithdraw, numericAmount])

  const historyTotals = useMemo(() => {
    return cashflowRows.reduce((summary, row) => {
      if (row.movement === 'Deposit') {
        summary.deposits += row.amount
      } else {
        summary.withdrawals += row.amount
      }

      return summary
    }, { deposits: 0, withdrawals: 0 })
  }, [cashflowRows])

  useEffect(() => {
    setHistoryData(null)

    if (projectId) {
      loadHistory(projectId, historyMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, historyMonth])

  const loadHistory = async (selectedProjectId = projectId, selectedMonth = historyMonth) => {
    if (!selectedProjectId) {
      setNotice({ type: 'warning', text: 'Please select a project first before viewing deposit/withdraw history.' })
      return
    }

    setHistoryLoading(true)
    setNotice(null)

    try {
      const { data } = await api.get('/reports/monthly', {
        params: {
          project_id: selectedProjectId,
          month: selectedMonth,
        },
      })

      setHistoryData(data)

      const movementCount = (data?.reports || []).reduce((count, report) => {
        return count + (report.transactions || []).filter((transaction) =>
          ['deposit', 'withdrawal'].includes(String(transaction.category || '').toLowerCase())
        ).length
      }, 0)

      if (movementCount === 0) {
        setNotice({ type: 'warning', text: 'No deposit/withdraw history found for this project and month.' })
      }
    } catch (error) {
      console.error(error)
      setHistoryData(null)
      setNotice({ type: 'warning', text: 'Could not load deposit/withdraw history. Make sure the backend is running.' })
    } finally {
      setHistoryLoading(false)
    }
  }

  const exportHistory = () => {
    if (!projectId) {
      setNotice({ type: 'warning', text: 'Please select a project first before exporting history.' })
      return
    }

    if (cashflowRows.length === 0) {
      setNotice({ type: 'warning', text: 'No deposit/withdraw history available to export.' })
      return
    }

    const rows = cashflowRows.map((row) => ({
      'Project Name': row.projectName,
      Movement: row.movement,
      Description: row.description,
      Amount: row.amount,
      Payment: row.paymentMethod,
      Reference: row.reference,
      Person: row.person,
      Review: row.review,
      Date: formatDate(row.date),
      'Report ID': row.reportId,
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        'Project Name',
        'Movement',
        'Description',
        'Amount',
        'Payment',
        'Reference',
        'Person',
        'Review',
        'Date',
        'Report ID',
      ],
    })

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cashflow History')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const safeProjectName = (selectedProject?.project_name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()

    saveAs(file, `deposit_withdraw_history_${safeProjectName}_${historyMonth}.xlsx`)
    setNotice({ type: 'success', text: 'Deposit/withdraw history exported successfully.' })
  }

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
      await loadHistory(projectId, historyMonth)
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: error?.response?.data?.message || 'Could not save deposit/withdraw entry.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="page-hero">
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

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Deposit / Withdraw History</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Track saved project cash movements by month and export them for finance review.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[180px_1fr_1fr]">
              <Field label="History Month" icon={CalendarDays}>
                <input className="input" type="month" value={historyMonth} onChange={(event) => setHistoryMonth(event.target.value)} />
              </Field>
              <div className="flex items-end">
                <button type="button" onClick={() => loadHistory()} disabled={historyLoading} className="btn btn-light w-full">
                  {historyLoading ? <RefreshCcw size={17} className="animate-spin" /> : <Search size={17} />}
                  {historyLoading ? 'Loading...' : 'View History'}
                </button>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={exportHistory} className="btn btn-primary w-full">
                  <FileSpreadsheet size={17} />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="History Deposits" value={historyTotals.deposits} color="text-emerald-700" />
            <MiniMetric label="History Withdrawals" value={historyTotals.withdrawals} color="text-rose-700" />
            <MiniMetric label="Net Movement" value={historyTotals.deposits - historyTotals.withdrawals} color={historyTotals.deposits - historyTotals.withdrawals < 0 ? 'text-rose-700' : 'text-cyan-700'} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 font-extrabold text-slate-500">
              <tr>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Date</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Movement</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Description</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">Amount</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Payment</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Person</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Reference</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashflowRows.map((row) => (
                <tr key={`${row.reportId}-${row.movement}-${row.description}-${row.amount}`} className="transition hover:bg-slate-50/30">
                  <td className="p-4 text-xs font-semibold text-slate-400">{formatDate(row.date)}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${row.movement === 'Deposit' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-rose-50 text-rose-700 ring-rose-600/10'}`}>
                      {row.movement}
                    </span>
                  </td>
                  <td className="p-4 font-extrabold text-slate-900">{row.description}</td>
                  <td className={`p-4 text-right font-black ${row.movement === 'Deposit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-500">{row.paymentMethod}</td>
                  <td className="p-4 text-xs font-semibold text-slate-500">{row.person || '-'}</td>
                  <td className="p-4 text-xs font-semibold text-slate-500">{row.reference || '-'}</td>
                  <td className="p-4 text-xs font-black text-slate-400">#{row.reportId}</td>
                </tr>
              ))}

              {cashflowRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center font-bold text-slate-400">
                    {projectId ? 'No deposit/withdraw history found for this month.' : 'Select a project to view deposit/withdraw history.'}
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

function MiniMetric({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-black ${color}`}>${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const mIdx = parseInt(month, 10) - 1

    if (mIdx >= 0 && mIdx < 12) {
      return `${months[mIdx]} ${parseInt(day, 10)}, ${year}`
    }
  }

  return cleanStr
}
