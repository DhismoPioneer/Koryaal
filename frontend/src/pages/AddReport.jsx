import React, { useEffect, useMemo, useState } from 'react'
import {
  Upload,
  Wand2,
  Save,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Wallet,
  ClipboardList,
  CalendarDays,
  Building2,
  RefreshCcw,
  ChevronRight,
  BadgeDollarSign,
  Compass,
  CreditCard,
  BookOpen,
} from 'lucide-react'
import api from '../services/api'
import { parseWhatsAppReport } from '../utils/localParser'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function AddReport() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('Not Provided')
  const [rawMessage, setRawMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [notice, setNotice] = useState(null)
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoadingProjects(true)

    try {
      const { data } = await api.get('/projects')
      const list = data || []

      setProjects(list)

      // Always force user to select project manually
      setProjectId('')
    } catch (error) {
      console.error('Could not load projects:', error)
      setProjects([])
      setNotice({
        type: 'warning',
        text: 'Could not load projects. Make sure the Laravel backend is running.',
      })
    } finally {
      setLoadingProjects(false)
    }
  }

  const totals = useMemo(() => {
    return preview || parseWhatsAppReport(rawMessage, paymentMethod)
  }, [preview, rawMessage, paymentMethod])

  const selectedProject = projects.find((p) => String(p.id) === String(projectId))
  const hasLineCalculationErrors = (totals.records || []).some((item) => item.calculation_error)
  const hasTotalMismatch = totals.total_status === 'mismatch'
  const selectedProjectCompleted = selectedProject?.status === 'completed'

  const budget = Number(selectedProject?.budget || 0)
  const spent = Number(selectedProject?.spent_amount || 0)
  const remaining = Number(selectedProject?.remaining_budget || 0)
  const budgetUsage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0


  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || [])
    setAttachments(files)
  }

  const clearAttachments = () => {
    setAttachments([])
  }

  const toFormDataValue = (value) => {
    if (typeof value === 'boolean') return value ? '1' : '0'
    return value
  }

  const canSaveParsedReport = (parsed) => {
    const badLine = (parsed.records || []).find((item) => item.calculation_error)

    if (badLine) {
      setNotice({
        type: 'warning',
        text: badLine.review_reason || 'Please correct wrong quantity x rate calculations before saving.',
      })
      return false
    }

    if (parsed.total_status === 'mismatch') {
      setNotice({
        type: 'warning',
        text: 'Provided Total does not match calculated transactions. Please correct the report before saving.',
      })
      return false
    }

    return true
  }
  const extractPreview = () => {
    setNotice(null)

    if (!projectId) {
      setNotice({
        type: 'warning',
        text: 'Please select a project first before entering or extracting a report.',
      })
      return
    }

    if (!rawMessage.trim()) {
      setNotice({
        type: 'warning',
        text: 'Please paste the engineer WhatsApp message first.',
      })
      return
    }

    const project = projects.find((p) => String(p.id) === String(projectId))

    if (project?.status === 'completed') {
      setNotice({
        type: 'warning',
        text: 'This project is completed. You cannot add a new report to it.',
      })
      return
    }

    const localData = parseWhatsAppReport(rawMessage, paymentMethod)

    setPreview(localData)

    setNotice({
      type: 'success',
      text: 'Report parsed successfully using smart category parser.',
    })
  }

  const saveReport = async () => {
    setSaving(true)
    setNotice(null)

    try {
      if (!projectId) {
        setNotice({
          type: 'warning',
          text: 'Please select a project first before saving this report.',
        })
        setSaving(false)
        return
      }

      if (!rawMessage.trim()) {
        setNotice({
          type: 'warning',
          text: 'Please paste the engineer WhatsApp message first.',
        })
        setSaving(false)
        return
      }

      const project = projects.find((p) => String(p.id) === String(projectId))

      if (project?.status === 'completed') {
        setNotice({
          type: 'warning',
          text: 'This project is completed. You cannot add a new report to it.',
        })
        setSaving(false)
        return
      }

      // Important: always use smart local parser when saving.
      // Do not save old backend preview categories.
      const parsed = parseWhatsAppReport(rawMessage, paymentMethod)

      if (!canSaveParsedReport(parsed)) {
        setSaving(false)
        return
      }

      const payload = {
        project_id: Number(projectId),
        report_date: reportDate,
        raw_message: rawMessage,
        payment_method: parsed.payment_method || paymentMethod,
        provided_total: parsed.provided_total,
        calculated_total: parsed.calculated_total,
        difference: parsed.difference,
        total_status: parsed.total_status,
        transactions: parsed.records,
      }

      let requestBody = payload
      let requestConfig = undefined

      if (attachments.length > 0) {
        const formData = new FormData()
        formData.append('project_id', payload.project_id)
        formData.append('report_date', payload.report_date)
        formData.append('raw_message', payload.raw_message)
        formData.append('payment_method', payload.payment_method)
        if (payload.provided_total !== null && payload.provided_total !== undefined) formData.append('provided_total', payload.provided_total)
        formData.append('calculated_total', payload.calculated_total)
        if (payload.difference !== null && payload.difference !== undefined) formData.append('difference', payload.difference)
        formData.append('total_status', payload.total_status)

        payload.transactions.forEach((item, index) => {
          Object.entries(item).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formData.append(`transactions[${index}][${key}]`, toFormDataValue(value))
            }
          })
        })

        attachments.forEach((file) => formData.append('attachments[]', file))
        requestBody = formData
        requestConfig = { headers: { 'Content-Type': 'multipart/form-data' } }
      }

      const { data } = await api.post('/daily-reports', requestBody, requestConfig)

      setNotice({
        type: 'success',
        text: `Successfully saved report #${data.id} containing ${data.transactions?.length || 0} transactions.`,
      })

      setRawMessage('')
      setPreview(null)
      setAttachments([])
      await loadProjects()
    } catch (error) {
      console.error('Save report error:', error)

      setNotice({
        type: 'warning',
        text:
          error?.response?.data?.message ||
          'Could not save to database. Check if Laravel is running and project status is active.',
      })
    } finally {
      setSaving(false)
    }
  }

  const generateExcel = () => {
    if (!projectId) {
      setNotice({
        type: 'warning',
        text: 'Please select a project before generating Excel.',
      })
      return
    }

    if (!rawMessage.trim()) {
      setNotice({
        type: 'warning',
        text: 'Please paste the engineer WhatsApp message first.',
      })
      return
    }

    const parsed = parseWhatsAppReport(rawMessage, paymentMethod)

    const projectName = selectedProject?.project_name || `Project ID ${projectId}`

    const transactionRows = (parsed.records || []).map((item) => ({
      'Project Name': projectName,
      Description: item.description || '',
      Category: item.category || '',
      Qty: item.quantity ?? '',
      Rate: item.unit_price ?? '',
      Amount: item.amount ?? 0,
      Payment: item.payment_method || parsed.payment_method || paymentMethod,
      Review: item.needs_review ? 'Check' : 'OK',
      Date: reportDate,
    }))

    if (transactionRows.length === 0) {
      setNotice({
        type: 'warning',
        text: 'No transactions available to export.',
      })
      return
    }

    const workbook = XLSX.utils.book_new()

    const worksheet = XLSX.utils.json_to_sheet(transactionRows, {
      header: [
        'Project Name',
        'Description',
        'Category',
        'Qty',
        'Rate',
        'Amount',
        'Payment',
        'Review',
        'Date',
      ],
    })

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 28 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    saveAs(file, `koryaal_${safeProjectName}_${reportDate}.xlsx`)

    setNotice({
      type: 'success',
      text: 'Excel report generated successfully.',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Banner Header */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <ClipboardList size={14} />
                Financial Report Entry
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
                Parser Dashboard
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Paste engineer messages from WhatsApp to dynamically parse transactions,
                audit math differences, and log values into active project accounts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:min-w-[320px]">
              <HeroStat
                label="Extracted Outflow"
                value={`$${Number(totals.calculated_total || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}`}
              />
              <HeroStat
                label="Extracted Rows"
                value={`${(totals.records || []).length} items`}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-5">
        {/* Form Inputs */}
        <section className="xl:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Report Parameters
                </h3>
                <p className="text-xs text-slate-400">
                  Bind entry details to a specific project.
                </p>
              </div>

              <button
                onClick={loadProjects}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:scale-95"
                title="Refresh projects list"
              >
                <RefreshCcw
                  size={16}
                  className={loadingProjects ? 'animate-spin' : ''}
                />
              </button>
            </div>

            <div className="space-y-5">
              <Field label="Project Node" icon={Compass}>
                <div className="relative">
                  <select
                    className="input appearance-none pr-10"
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      setPreview(null)
                      setNotice(null)
                    }}
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                        disabled={project.status === 'completed'}
                      >
                        {project.project_name}
                        {project.status === 'completed'
                          ? ' (Completed)'
                          : ` - Remaining $${Number(project.remaining_budget || 0).toFixed(0)}`}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ▼
                  </span>
                </div>
              </Field>

              {/* Project Mini Detail Card */}
              {selectedProject && (
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200/50 pb-3">
                    <div>
                      <p className="text-base font-extrabold leading-none text-slate-950">
                        {selectedProject.project_name}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {selectedProject.location || 'Mogadishu, Somalia'}
                      </p>
                    </div>

                    <ProjectStatusBadge status={selectedProject.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <MiniInfo label="Budget Limit" value={`$${Math.round(budget).toLocaleString()}`} />
                    <MiniInfo label="Spent Rate" value={`$${Math.round(spent).toLocaleString()}`} />
                    <MiniInfo label="Remaining" value={`$${Math.round(remaining).toLocaleString()}`} />
                  </div>

                  <div className="pt-2">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Spent Utilization</span>
                      <span className="font-extrabold text-slate-950">
                        {budgetUsage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/55">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getBudgetColor(
                          selectedProject.budget_status
                        )}`}
                        style={{ width: `${budgetUsage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedProjectCompleted && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-extrabold text-rose-700">
                  This project node is closed/completed. New reports are blocked.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Report Log Date" icon={CalendarDays}>
                  <input
                    className="input text-xs font-semibold text-slate-800"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </Field>

                <Field label="Default Payment" icon={CreditCard}>
                  <div className="relative">
                    <select
                      className="input appearance-none pr-10"
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value)
                        setPreview(null)
                      }}
                    >
                      <option>Not Provided</option>
                      <option>EVC Plus</option>
                      <option>E-Dahab</option>
                      <option>Bank</option>
                      <option>Cash</option>
                      <option>Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      ▼
                    </span>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className="card space-y-5 p-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                WhatsApp Log Output
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Paste the engineer text report exactly as copied.
              </p>
            </div>

            <textarea
              className="min-h-56 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 font-mono text-sm text-slate-800 outline-none transition-all focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
              value={rawMessage}
              placeholder={`Example:
5 fuundi x15.5 = 77.5
3 shaqaale x7.5 = 22.5
matoor = 35
Total = 135
Payment: EVC`}
              onChange={(e) => {
                setRawMessage(e.target.value)
                setPreview(null)
              }}
            />

            <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/30 p-4 text-center transition duration-300 hover:border-cyan-300 hover:bg-cyan-50/30">
              <Upload className="mx-auto text-slate-400" size={20} />
              <p className="mt-2 text-xs font-extrabold text-slate-700">
                Media Attachments / Receipts
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Upload invoice PDFs, receipt images, or payment screenshots.
              </p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleAttachmentChange}
                className="hidden"
              />
            </label>

            {attachments.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-black text-slate-700">
                    {attachments.length} attachment{attachments.length > 1 ? 's' : ''} selected
                  </p>
                  <button
                    type="button"
                    onClick={clearAttachments}
                    className="text-[10px] font-black text-rose-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1.5">
                  {attachments.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                      <span className="truncate">{file.name}</span>
                      <span className="shrink-0 pl-3 text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={extractPreview}
                className="btn btn-light"
              >
                <Wand2 size={16} />
                Extract Preview
              </button>

              <button
                onClick={saveReport}
                disabled={saving || selectedProjectCompleted || hasLineCalculationErrors || hasTotalMismatch}
                className="btn btn-primary"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Report'}
              </button>
            </div>

            <button
              onClick={generateExcel}
              className="btn w-full bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800 active:scale-95"
            >
              <FileSpreadsheet size={17} />
              Generate Excel
            </button>

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
          </div>
        </section>

        {/* Extracted preview grids */}
        <section className="xl:col-span-3 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Provided Sum"
              value={totals.provided_total ?? 'N/A'}
              icon={BadgeDollarSign}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <SummaryCard
              label="Calculated Sum"
              value={`$${Number(totals.calculated_total || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              icon={Wallet}
              color="text-cyan-600"
              bg="bg-cyan-50"
            />
            <SummaryCard
              label="Audited Delta"
              value={totals.difference ?? 'N/A'}
              icon={AlertTriangle}
              color="text-rose-500"
              bg="bg-rose-50"
            />

            <div className="card flex flex-col justify-between p-4 hover:border-slate-200/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audit Result
              </p>
              <p
                className={`mt-2 flex items-center gap-1.5 text-sm font-black uppercase tracking-wider ${
                  totals.total_status === 'matched'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {totals.total_status === 'matched' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                {totals.total_status || 'unparsed'}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Extracted Transactions List
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Verify values, categories, and payment indicators before committing details.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  <ChevronRight size={14} />
                  {(totals.records || []).length} entries detected
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 font-extrabold text-slate-500">
                  <tr>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Description
                    </th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Category
                    </th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Method
                    </th>
                    <th className="p-4 text-center text-[10px] font-black uppercase tracking-wider">
                      Verification
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(totals.records || []).map((r, i) => (
                    <tr key={i} className="transition hover:bg-slate-50/30">
                      <td className="p-4 font-extrabold text-slate-950">
                        {r.description}
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-500">
                        {r.quantity ?? '-'}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-500">
                        {r.unit_price ? `$${Number(r.unit_price).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-slate-950">
                        ${Number(r.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-4 text-left text-xs font-semibold text-slate-400">
                        {r.payment_method}
                      </td>
                      <td className="p-4 text-center">
                        {r.needs_review ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-inset ring-amber-600/10">
                            Check
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {(!totals.records || totals.records.length === 0) && (
                    <tr>
                      <td colSpan="7" className="p-12 text-center font-bold text-slate-400">
                        Awaiting raw output paste for preview extraction.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
              <h4 className="flex items-center gap-2 text-base font-extrabold text-cyan-950">
                <BookOpen size={16} />
                Financial Logic
              </h4>
              <p className="text-xs leading-relaxed text-cyan-800">
                Saving reports creates structured audit trails. Expenses automatically
                deduct against allocations. Project boundaries protect against reporting
                expenses to finished/completed projects.
              </p>
            </div>

            <div className="card space-y-3 p-5">
              <h4 className="text-base font-extrabold text-slate-900">
                Best Practices
              </h4>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-1.5">• Verify matched status indicators.</li>
                <li className="flex items-center gap-1.5">• Assign transaction payments properly.</li>
                <li className="flex items-center gap-1.5">• Export reports as management logs.</li>
              </ul>
            </div>
          </div>
        </section>
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

function HeroStat({ label, value }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-black leading-none text-white">{value}</p>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card group flex flex-col justify-between p-4 hover:border-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-lg font-black leading-none text-slate-900">
            {value}
          </p>
        </div>

        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color} transition duration-300 group-hover:scale-110`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100/50 bg-white p-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-none text-slate-950">
        {value}
      </p>
    </div>
  )
}

function ProjectStatusBadge({ status }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    in_progress: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    delayed: 'bg-orange-50 text-orange-700 ring-orange-600/10',
  }

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function getBudgetColor(status) {
  if (status === 'near_limit') return 'bg-gradient-to-r from-orange-400 to-orange-500'
  if (status === 'over_budget') return 'bg-gradient-to-r from-rose-400 to-rose-500'
  if (status === 'no_budget') return 'bg-slate-400'
  return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
}








