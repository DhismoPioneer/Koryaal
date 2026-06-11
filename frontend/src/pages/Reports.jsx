import React, { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  Search,
  FileText,
  RefreshCcw,
  Compass,
  Calendar,
  Layers3,
  BadgeDollarSign,
  TrendingDown,
  Scale,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import api from '../services/api'

export default function Reports() {
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

        // Do not auto-select first project.
        // User must select project manually.
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

    if (!projectId) {
      return
    }

    if (projectId && month) {
      loadReport(projectId, month)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, month])

  const loadReport = async (selectedProjectId = projectId, selectedMonth = month) => {
    if (!selectedProjectId) {
      setNotice({
        type: 'warning',
        text: 'Please select a project first before loading saved reports.',
      })
      return
    }

    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.get('/reports/monthly', {
        params: {
          project_id: selectedProjectId,
          month: selectedMonth,
        },
      })

      setData(data)

      if (!data.rows || data.rows.length === 0) {
        setNotice({
          type: 'warning',
          text: 'No saved reports found for this project and month.',
        })
      } else {
        setNotice({
          type: 'success',
          text: `Successfully loaded ${data.reports_count} reports containing ${data.transactions_count} transactions.`,
        })
      }
    } catch (error) {
      console.error(error)
      setData(null)
      setNotice({
        type: 'warning',
        text: 'Could not load saved reports. Make sure the backend is running.',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateExcel = () => {
    if (!projectId) {
      setNotice({
        type: 'warning',
        text: 'Please select a project first before exporting monthly Excel.',
      })
      return
    }

    if (!data || !data.rows || data.rows.length === 0) {
      setNotice({
        type: 'warning',
        text: 'No saved report data found for this month.',
      })
      return
    }

    const rows = data.rows.map((row) => ({
      'Project Name': row.project_name,
      Description: row.description,
      Category: row.category,
      Qty: row.qty ?? '',
      Rate: row.rate ?? '',
      Amount: row.amount ?? 0,
      Payment: row.payment,
      Review: row.review,
      Date: formatDate(row.date),
    }))

    const workbook = XLSX.utils.book_new()

    const worksheet = XLSX.utils.json_to_sheet(rows, {
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
      { wch: 30 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const selectedProject = projects.find((p) => String(p.id) === String(projectId))
    const projectName = selectedProject?.project_name || 'project'

    const safeProjectName = projectName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()

    saveAs(file, `monthly_report_${safeProjectName}_${month}.xlsx`)

    setNotice({
      type: 'success',
      text: 'Monthly Excel report generated successfully.',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Banner Header */}
      <section className="page-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />

        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <FileText size={14} />
              Financial Analytics
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
              Reports Center
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Generate monthly financial audits for active projects and compile structured XLSX management reports.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters Card */}
      <section className="card space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Project Node" icon={Compass}>
            <div className="relative">
              <select
                className="input appearance-none pr-10"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value)
                  setData(null)
                  setNotice(null)
                }}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                ?
              </span>
            </div>
          </Field>

          <Field label="Audit Month" icon={Calendar}>
            <input
              className="input font-semibold text-slate-800"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                setData(null)
              }}
            />
          </Field>

          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadReport()}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? <RefreshCcw size={17} className="animate-spin" /> : <Search size={17} />}
                {loading ? 'Compiling...' : 'Load Saved Reports'}
              </button>

              <button
                onClick={generateExcel}
                className="btn btn-light"
                title="Export to Excel"
              >
                <FileSpreadsheet size={18} />
                Export
              </button>
            </div>
          </div>
        </div>

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
      </section>

      {data && (
        <>
          {/* KPI Grid */}
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Reports Saved"
              value={data.reports_count ?? 0}
              icon={FileText}
              color="text-cyan-600"
              bg="bg-cyan-50"
            />
            <StatCard
              label="Transactions Audit"
              value={data.transactions_count ?? 0}
              icon={Layers3}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <StatCard
              label="Total Expenses"
              value={`$${Number(data.total_expenses || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              icon={TrendingDown}
              color="text-rose-500"
              bg="bg-rose-50"
            />
            <StatCard
              label="Computed Balance"
              value={`$${Number(data.balance || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
              icon={Scale}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </section>
          {/* Table List */}
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
              <h3 className="text-xl font-extrabold text-slate-900">
                Saved Monthly Transactions
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated transactional line-items extracted and validated for the selected timeline.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 font-extrabold text-slate-500">
                  <tr>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Project Name
                    </th>
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
                      Payment
                    </th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Review
                    </th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(data.rows || []).map((row, index) => (
                    <tr key={index} className="transition hover:bg-slate-50/30">
                      <td className="p-4 font-semibold text-slate-500">
                        {row.project_name}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900">
                        {row.description}
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {row.qty ?? '-'}
                      </td>
                      <td className="p-4 text-right">
                        {row.rate ? `$${Number(row.rate).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">
                        ${Number(row.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {row.payment}
                      </td>
                      <td className="p-4">
                        <ReviewBadge status={row.review} />
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-400">
                        {formatDate(row.date)}
                      </td>
                    </tr>
                  ))}

                  {(!data.rows || data.rows.length === 0) && (
                    <tr>
                      <td colSpan="9" className="p-12 text-center font-bold text-slate-400">
                        No saved transactions cataloged for this monthly timeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card group flex items-center justify-between p-5 hover:-translate-y-0.5 hover:border-slate-200/50 hover:shadow-lg">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-black leading-none text-slate-950">
          {value}
        </p>
      </div>

      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ${color} transition duration-300 group-hover:scale-110`}>
        <Icon size={20} />
      </div>
    </div>
  )
}

function getAttachments(data) {
  return (data?.reports || []).flatMap((report) =>
    (report.attachments || []).map((attachment) => ({
      ...attachment,
      report_date: report.report_date,
    }))
  )
}
function ReviewBadge({ status }) {
  const isOk = status?.toLowerCase() === 'ok' || status?.toLowerCase() === 'verified'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${
        isOk
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
          : 'bg-amber-50 text-amber-700 ring-amber-600/10'
      }`}
    >
      {status}
    </span>
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

  if (parts.length === 3) {
    const [year, month, day] = parts
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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


