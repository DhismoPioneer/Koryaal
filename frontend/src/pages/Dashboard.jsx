import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Compass,
  CreditCard,
  FileText,
  Flag,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCcw,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import api from '../services/api'

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
}

export default function Dashboard({ authUser }) {
  const [dashboardData, setDashboardData] = useState({
    companyName: authUser?.company?.name || 'Company Workspace',
    companyStatus: authUser?.company?.status || 'active',
    userRole: authUser?.role || 'admin',
    projectsCount: 0,
    activeProjectsCount: 0,
    pendingReportsCount: 0,
    thisMonthExpenses: 0,
    thisMonthIncome: 0,
    needsReviewCount: 0,
    projects: [],
    transactions: [],
  })

  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [summaryRes, projectsRes, txRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/projects'),
        api.get('/transactions'),
      ])

      const txData = txRes.data?.data || txRes.data || []
      const projectData = projectsRes.data || []

      setDashboardData({
        companyName:
          summaryRes.data?.company_name ||
          authUser?.company?.name ||
          'Company Workspace',
        companyStatus:
          summaryRes.data?.company_status ||
          authUser?.company?.status ||
          'active',
        userRole: summaryRes.data?.user_role || authUser?.role || 'admin',
        projectsCount: summaryRes.data?.projects || projectData.length || 0,
        activeProjectsCount:
          summaryRes.data?.active_projects ||
          projectData.filter((p) => p.status === 'in_progress').length ||
          0,
        pendingReportsCount: summaryRes.data?.pending_reports || 0,
        thisMonthExpenses: summaryRes.data?.this_month_expenses || 0,
        thisMonthIncome: summaryRes.data?.this_month_income || 0,
        needsReviewCount:
          summaryRes.data?.needs_review ||
          txData.filter((t) => t.needs_review).length ||
          0,
        projects: projectData,
        transactions: txData,
      })

      setIsOffline(false)
    } catch (error) {
      console.warn('Dashboard API failed, loading mock data:', error)
      setIsOffline(true)

      setDashboardData({
        companyName: authUser?.company?.name || 'Demo Company',
        companyStatus: authUser?.company?.status || 'active',
        userRole: authUser?.role || 'admin',
        projectsCount: 4,
        activeProjectsCount: 2,
        pendingReportsCount: 1,
        thisMonthExpenses: 790,
        thisMonthIncome: 1200,
        needsReviewCount: 1,
        projects: [
          {
            id: 'mock-1',
            project_name: 'Taleh Construction Project',
            budget: 150000,
            spent_amount: 108000,
            remaining_budget: 42000,
            status: 'in_progress',
            location: 'Hodan, Mogadishu',
            end_date: '2026-07-15',
          },
          {
            id: 'mock-2',
            project_name: 'Hodan Villa Complex',
            budget: 85000,
            spent_amount: 42500,
            remaining_budget: 42500,
            status: 'in_progress',
            location: 'Hodan, Mogadishu',
            end_date: '2026-06-28',
          },
          {
            id: 'mock-3',
            project_name: 'Airport Road Extension',
            budget: 300000,
            spent_amount: 290000,
            remaining_budget: 10000,
            status: 'delayed',
            location: 'Wadajir, Mogadishu',
            end_date: '2026-06-09',
          },
          {
            id: 'mock-4',
            project_name: 'Waberi School Renovations',
            budget: 45000,
            spent_amount: 45000,
            remaining_budget: 0,
            status: 'completed',
            location: 'Waberi, Mogadishu',
            end_date: '2026-05-28',
          },
        ],
        transactions: [
          {
            id: 't-1',
            project_id: 'mock-1',
            description: 'Cement delivery - 200 bags',
            category: 'Raw Materials',
            amount: 1400,
            type: 'expense',
            date: '2026-06-05',
            needs_review: false,
            payment_method: 'Cash',
          },
          {
            id: 't-2',
            project_id: 'mock-1',
            description: 'Electrical cabling labor',
            category: 'Labor & Contracting',
            amount: 850,
            type: 'expense',
            date: '2026-06-04',
            needs_review: true,
            payment_method: 'Pending',
          },
          {
            id: 't-3',
            project_id: 'mock-2',
            description: 'Client payment milestone 2',
            category: 'deposit',
            amount: 1200,
            type: 'income',
            date: '2026-06-04',
            needs_review: false,
            payment_method: 'Bank',
          },
          {
            id: 't-4',
            project_id: 'mock-3',
            description: 'Excavator rental - 3 days',
            category: 'Equipment Rental',
            amount: 1800,
            type: 'expense',
            date: '2026-06-03',
            needs_review: false,
            payment_method: 'EVC Plus',
          },
          {
            id: 't-5',
            project_id: 'mock-1',
            description: 'Fuel for site generator',
            category: 'Logistics & Fuel',
            amount: 350,
            type: 'expense',
            date: '2026-06-02',
            needs_review: false,
            payment_method: 'Cash',
          },
        ],
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const {
    projects,
    transactions,
    companyName,
    companyStatus,
    projectsCount,
    activeProjectsCount,
    pendingReportsCount,
    thisMonthExpenses,
    thisMonthIncome,
    needsReviewCount,
  } = dashboardData

  const isAll = selectedProjectId === 'all'
  const selectedProject = isAll
    ? null
    : projects.find((p) => String(p.id) === String(selectedProjectId))

  const filteredTransactions = isAll
    ? transactions
    : transactions.filter((t) => String(t.project_id) === String(selectedProjectId))

  const projectRows = isAll ? projects : projects.filter((p) => String(p.id) === String(selectedProjectId))

  const metrics = useMemo(() => {
    const expenseTotal =
      thisMonthExpenses ||
      filteredTransactions
        .filter((t) => isExpense(t))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const incomeTotal =
      thisMonthIncome ||
      filteredTransactions
        .filter((t) => isIncome(t))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    return {
      totalProjects: isAll ? projectsCount || projects.length : projectRows.length,
      activeProjects: isAll
        ? activeProjectsCount || projects.filter((p) => p.status === 'in_progress').length
        : projectRows.filter((p) => p.status === 'in_progress').length,
      monthlyExpenses: expenseTotal,
      clientPayments: incomeTotal,
      reviewCount:
        needsReviewCount ||
        filteredTransactions.filter((t) => t.needs_review).length ||
        pendingReportsCount,
    }
  }, [
    activeProjectsCount,
    filteredTransactions,
    isAll,
    needsReviewCount,
    pendingReportsCount,
    projectRows,
    projects,
    projectsCount,
    thisMonthExpenses,
    thisMonthIncome,
  ])

  const statusSummary = useMemo(() => {
    const source = isAll ? projects : projectRows
    return {
      pending: source.filter((p) => p.status === 'pending').length,
      in_progress: source.filter((p) => p.status === 'in_progress').length,
      completed: source.filter((p) => p.status === 'completed').length,
      delayed: source.filter((p) => p.status === 'delayed').length,
    }
  }, [isAll, projectRows, projects])

  const chartData = useMemo(() => getMonthlyTrend(filteredTransactions), [filteredTransactions])
  const reviewItems = filteredTransactions.filter((t) => t.needs_review).slice(0, 5)
  const paymentMethods = getPaymentMethodSummary(filteredTransactions)
  const milestones = getUpcomingMilestones(projectRows)
  const recentReports = filteredTransactions.slice(0, 8)

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
          <RefreshCcw className="h-9 w-9 animate-spin text-cyan-700" />
          <p className="text-sm font-bold text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/10">
              <LayoutDashboard size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Executive Dashboard
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {companyName} - {isAll ? 'All construction projects' : selectedProject?.project_name}
              </p>
            </div>
            <SyncBadge isOffline={isOffline} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(statusSummary).map(([status, count]) => (
              <StatusPill key={status} status={status} count={count} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="project-filter">Filter project</label>
          <div className="relative min-w-[220px]">
            <Compass
              size={17}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              id="project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="input appearance-none py-3 pl-10 pr-10"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              v
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-cyan-100"
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
          </button>

          <Link to="/add-report" className="btn btn-primary">
            <Plus size={18} aria-hidden="true" />
            Add Report
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        <KpiCard
          className="xl:col-span-3"
          label="Total Projects"
          value={metrics.totalProjects}
          helper={`${statusSummary.delayed} delayed, ${statusSummary.completed} completed`}
          icon={FolderKanban}
          tone="cyan"
        />
        <KpiCard
          className="xl:col-span-3"
          label="Active Projects"
          value={metrics.activeProjects}
          helper={`${statusSummary.pending} pending start`}
          icon={Clock3}
          tone="indigo"
        />
        <KpiCard
          className="xl:col-span-3"
          label="Monthly Expenses"
          value={formatMoney(metrics.monthlyExpenses)}
          helper="Current month outflow"
          icon={Wallet}
          tone="rose"
        />
        <KpiCard
          className="xl:col-span-3"
          label="Client Payments"
          value={formatMoney(metrics.clientPayments)}
          helper="Received this month"
          icon={Landmark}
          tone="emerald"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader
            icon={TrendingIcon}
            title="Expenses vs Payments"
            subtitle="Monthly cash movement across selected projects"
          />
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#64748b" fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `$${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Expenses"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  fill="url(#expenseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="Payments"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#paymentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
            {paymentMethods.slice(0, 3).map((item) => (
              <div key={item.name} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{item.name}</p>
                <p className="mt-1 font-mono text-lg font-black text-slate-950">{formatMoney(item.amount)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader
            icon={AlertTriangle}
            title="Reports Needing Review"
            subtitle={`${metrics.reviewCount} item${metrics.reviewCount === 1 ? '' : 's'} need attention`}
          />
          <div className="mt-6 space-y-3">
            {reviewItems.length > 0 ? (
              reviewItems.map((item) => (
                <ReviewItem key={item.id || `${item.description}-${item.date}`} item={item} projects={projects} />
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No reports waiting"
                text="Everything visible in this project scope is reviewed."
              />
            )}
          </div>
          <Link to="/reports" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-700 hover:text-cyan-600">
            Open reports
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader
            icon={Building2}
            title="Project Status"
            subtitle="Budget, spend, schedule, and current status"
          />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-3">Project</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3 text-right">Budget</th>
                  <th className="px-3 py-3 text-right">Spent</th>
                  <th className="px-3 py-3">Progress</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectRows.slice(0, 8).map((project) => {
                  const budget = Number(project.budget || 0)
                  const spent = Number(project.spent_amount || 0)
                  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : getProjectProgress(project)

                  return (
                    <tr key={project.id} className="transition hover:bg-slate-50">
                      <td className="px-3 py-4">
                        <p className="font-black text-slate-950">{project.project_name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Due {formatDate(project.end_date)}</p>
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} aria-hidden="true" className="text-slate-400" />
                          {project.location || 'No location'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right font-mono font-bold text-slate-900">{formatMoney(budget)}</td>
                      <td className="px-3 py-4 text-right font-mono font-bold text-slate-900">{formatMoney(spent)}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-cyan-600" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-mono text-xs font-black text-slate-600">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <StatusBadge status={project.status} />
                      </td>
                    </tr>
                  )
                })}

                {projectRows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-3 py-12">
                      <EmptyState icon={FolderKanban} title="No projects found" text="Create a project to start tracking site activity." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader
            icon={Flag}
            title="Upcoming Milestones"
            subtitle="Deadlines and project tasks that need attention"
          />
          <div className="mt-6 space-y-4">
            {milestones.length > 0 ? (
              milestones.map((item) => <MilestoneItem key={item.id} item={item} />)
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No urgent milestones"
                text="No upcoming due dates found for this project scope."
              />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader
            icon={ClipboardList}
            title="Recent Daily Reports"
            subtitle="Latest site transactions and report activity"
          />
          <Link to="/reports" className="btn btn-light px-4 py-2.5">
            View Reports
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs font-black uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3 text-center">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports.map((item) => (
                <tr key={item.id || `${item.description}-${item.date}`} className="transition hover:bg-slate-50">
                  <td className="px-3 py-4 text-xs font-bold text-slate-500">{formatDate(item.date || item.report_date)}</td>
                  <td className="px-3 py-4 font-bold text-slate-700">{getProjectName(projects, item.project_id)}</td>
                  <td className="px-3 py-4 font-black text-slate-950">{item.description || 'Daily report item'}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {item.category || 'Other'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-600">{getPaymentMethod(item)}</td>
                  <td className={`px-3 py-4 text-right font-mono font-black ${isIncome(item) ? 'text-emerald-700' : 'text-slate-950'}`}>
                    {isIncome(item) ? '+' : '-'}{formatMoney(Number(item.amount || 0))}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <ReviewBadge reviewed={!item.needs_review} />
                  </td>
                </tr>
              ))}

              {recentReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-3 py-12">
                    <EmptyState icon={FileText} title="No recent reports" text="Daily reports will appear here after they are submitted." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Card({ className = '', children }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  )
}

function CardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        {subtitle && <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function KpiCard({ className = '', label, value, helper, icon: Icon, tone }) {
  const tones = {
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  }

  return (
    <article className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tones[tone] || tones.cyan}`}>
          <Icon size={21} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{helper}</p>
    </article>
  )
}

function SyncBadge({ isOffline }) {
  return isOffline ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-600/10">
      <WifiOff size={12} aria-hidden="true" />
      Demo Mode
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-600/10">
      <Wifi size={12} aria-hidden="true" />
      Live Sync
    </span>
  )
}

function StatusPill({ status, count }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${getStatusClasses(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status] || status}: {count}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${getStatusClasses(status)}`}>
      {statusLabels[status] || status || 'Pending'}
    </span>
  )
}

function ReviewBadge({ reviewed }) {
  return reviewed ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-600/10">
      Verified
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-600/10">
      Review
    </span>
  )
}

function ReviewItem({ item, projects }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-slate-950">{item.description || 'Report needs review'}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {getProjectName(projects, item.project_id)} - {formatDate(item.date || item.report_date)}
          </p>
        </div>
        <span className="font-mono text-sm font-black text-amber-800">{formatMoney(Number(item.amount || 0))}</span>
      </div>
    </div>
  )
}

function MilestoneItem({ item }) {
  const isLate = item.daysLeft < 0
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLate ? 'bg-rose-50 text-rose-700' : 'bg-cyan-50 text-cyan-700'}`}>
        {isLate ? <AlertTriangle size={17} aria-hidden="true" /> : <Flag size={17} aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <p className="font-black text-slate-950">{item.title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{item.projectName}</p>
        <p className={`mt-2 text-xs font-black ${isLate ? 'text-rose-700' : 'text-cyan-700'}`}>
          {isLate ? `${Math.abs(item.daysLeft)} days overdue` : `${item.daysLeft} days left`} - {formatDate(item.date)}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <Icon size={24} aria-hidden="true" className="mx-auto text-slate-400" />
      <p className="mt-3 font-black text-slate-800">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs shadow-xl">
      <p className="mb-2 font-black uppercase tracking-wide text-slate-400">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="mt-1 flex items-center gap-2 text-slate-200">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.stroke }} />
          <span className="font-bold">
            {item.name}: <span className="font-mono text-white">{formatMoney(Number(item.value || 0))}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function TrendingIcon(props) {
  return <BadgeDollarSign {...props} />
}

function getStatusClasses(status) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    in_progress: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    delayed: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  }
  return styles[status] || styles.pending
}

function getProjectName(projects, projectId) {
  return projects.find((project) => String(project.id) === String(projectId))?.project_name || 'Unassigned'
}

function isIncome(transaction) {
  const type = String(transaction.type || '').toLowerCase()
  const category = String(transaction.category || '').toLowerCase()
  return type === 'income' || category === 'deposit'
}

function isExpense(transaction) {
  return !isIncome(transaction)
}

function getPaymentMethod(transaction) {
  return transaction.payment_method || transaction.payment || 'Not provided'
}

function getPaymentMethodSummary(transactions) {
  const summary = {}
  transactions.forEach((transaction) => {
    const name = getPaymentMethod(transaction)
    summary[name] = (summary[name] || 0) + Number(transaction.amount || 0)
  })

  const rows = Object.entries(summary)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  if (rows.length > 0) return rows
  return [
    { name: 'Cash', amount: 0 },
    { name: 'Bank', amount: 0 },
    { name: 'EVC Plus', amount: 0 },
  ]
}

function getMonthlyTrend(transactions) {
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const baseRows = monthLabels.map((name) => ({ name, Expenses: 0, Payments: 0 }))

  transactions.forEach((transaction) => {
    const date = transaction.date || transaction.report_date
    const monthIndex = date ? new Date(String(date).slice(0, 10)).getMonth() : -1
    if (monthIndex < 0 || monthIndex > 5) return

    if (isIncome(transaction)) {
      baseRows[monthIndex].Payments += Number(transaction.amount || 0)
    } else {
      baseRows[monthIndex].Expenses += Number(transaction.amount || 0)
    }
  })

  const hasData = baseRows.some((row) => row.Expenses > 0 || row.Payments > 0)
  if (hasData) return baseRows

  return [
    { name: 'Jan', Expenses: 32000, Payments: 36000 },
    { name: 'Feb', Expenses: 48000, Payments: 52000 },
    { name: 'Mar', Expenses: 43000, Payments: 39000 },
    { name: 'Apr', Expenses: 72000, Payments: 76000 },
    { name: 'May', Expenses: 88000, Payments: 84000 },
    { name: 'Jun', Expenses: 79000, Payments: 94000 },
  ]
}

function getUpcomingMilestones(projects) {
  const today = new Date()
  return projects
    .filter((project) => project.end_date && project.status !== 'completed')
    .map((project) => {
      const due = new Date(String(project.end_date).slice(0, 10))
      const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: project.id,
        title: project.status === 'delayed' ? 'Resolve delayed schedule' : 'Upcoming handoff deadline',
        projectName: project.project_name,
        date: project.end_date,
        daysLeft,
      }
    })
    .filter((item) => item.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)
}

function getProjectProgress(project) {
  if (project.status === 'completed') return 100
  if (project.status === 'pending') return 8
  if (project.status === 'delayed') return 76
  return 42
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`
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
    const monthIndex = parseInt(month, 10) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`
    }
  }
  return cleanStr
}
