import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Compass,
  Wallet,
  ClipboardList,
  FileText,
  RefreshCcw,
  UserPlus,
  Layers3,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Activity,
  Building2,
  LayoutDashboard,
  ShieldCheck,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import api from '../services/api'

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
        projectsCount: summaryRes.data?.projects || projectsRes.data?.length || 0,
        activeProjectsCount:
          summaryRes.data?.active_projects ||
          projectsRes.data?.filter((p) => p.status === 'in_progress').length ||
          0,
        pendingReportsCount: summaryRes.data?.pending_reports || 0,
        thisMonthExpenses: summaryRes.data?.this_month_expenses || 0,
        thisMonthIncome: summaryRes.data?.this_month_income || 0,
        needsReviewCount:
          summaryRes.data?.needs_review ||
          txData.filter((t) => t.needs_review).length ||
          0,
        projects: projectsRes.data || [],
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
          },
          {
            id: 'mock-2',
            project_name: 'Hodan Villa Complex',
            budget: 85000,
            spent_amount: 42500,
            remaining_budget: 42500,
            status: 'in_progress',
            location: 'Hodan, Mogadishu',
          },
          {
            id: 'mock-3',
            project_name: 'Airport Road Extension',
            budget: 300000,
            spent_amount: 290000,
            remaining_budget: 10000,
            status: 'delayed',
            location: 'Wadajir, Mogadishu',
          },
          {
            id: 'mock-4',
            project_name: 'Waberi School Renovations',
            budget: 45000,
            spent_amount: 45000,
            remaining_budget: 0,
            status: 'completed',
            location: 'Waberi, Mogadishu',
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
            payment: 'Paid (Cash)',
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
            payment: 'Pending',
          },
          {
            id: 't-3',
            project_id: 'mock-2',
            description: 'Plumbing fittings',
            category: 'Raw Materials',
            amount: 620,
            type: 'expense',
            date: '2026-06-04',
            needs_review: false,
            payment: 'Paid (Transfer)',
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
            payment: 'Paid (Check)',
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
            payment: 'Paid (Cash)',
          },
          {
            id: 't-6',
            project_id: 'mock-2',
            description: 'Masonry work payment',
            category: 'Labor & Contracting',
            amount: 1200,
            type: 'expense',
            date: '2026-06-01',
            needs_review: false,
            payment: 'Paid (Transfer)',
          },
          {
            id: 't-7',
            project_id: 'mock-4',
            description: 'Final inspection certificate',
            category: 'Labor & Contracting',
            amount: 500,
            type: 'expense',
            date: '2026-05-28',
            needs_review: false,
            payment: 'Paid (Transfer)',
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
    userRole,
    projectsCount,
    activeProjectsCount,
    thisMonthExpenses,
    needsReviewCount,
  } = dashboardData

  const isAll = selectedProjectId === 'all'
  const selectedProject = isAll
    ? null
    : projects.find((p) => String(p.id) === String(selectedProjectId))

  const filteredTransactions = isAll
    ? transactions
    : transactions.filter((t) => String(t.project_id) === String(selectedProjectId))

  let budgetTotal = 0
  let spentTotal = 0

  if (isAll) {
    projects.forEach((p) => {
      budgetTotal += Number(p.budget || 0)
      spentTotal += Number(p.spent_amount || 0)
    })

    if (budgetTotal === 0) {
      budgetTotal = 580000
      spentTotal = 485500
    }
  } else if (selectedProject) {
    budgetTotal = Number(selectedProject.budget || 0)
    spentTotal = Number(selectedProject.spent_amount || 0)
  }

  const utilizationPercent =
    budgetTotal > 0 ? Math.min((spentTotal / budgetTotal) * 100, 100) : 0

  let cardExpenses = 0

  if (isAll) {
    cardExpenses =
      thisMonthExpenses ||
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    if (cardExpenses === 0) cardExpenses = 790
  } else {
    cardExpenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    if (cardExpenses === 0 && selectedProject) {
      cardExpenses = Number(selectedProject.spent_amount) * 0.15
    }
  }

  let activeCardValue = ''
  let activeCardSubtitle = ''
  let statusColor = 'text-cyan-600'
  let statusBg = 'bg-cyan-50'

  if (isAll) {
    activeCardValue = String(
      activeProjectsCount || projects.filter((p) => p.status === 'in_progress').length
    )
    activeCardSubtitle = `Out of ${projects.length || projectsCount} total projects`
  } else if (selectedProject) {
    const statusMap = {
      in_progress: 'In Progress',
      completed: 'Completed',
      delayed: 'Delayed',
      pending: 'Pending',
    }

    activeCardValue = statusMap[selectedProject.status] || 'Active'
    activeCardSubtitle = selectedProject.location || 'Mogadishu, Somalia'

    if (selectedProject.status === 'completed') {
      statusColor = 'text-emerald-600'
      statusBg = 'bg-emerald-50'
    } else if (selectedProject.status === 'delayed') {
      statusColor = 'text-rose-500'
      statusBg = 'bg-rose-50'
    } else if (selectedProject.status === 'pending') {
      statusColor = 'text-slate-500'
      statusBg = 'bg-slate-100'
    }
  }

  const txCardValue = isAll
    ? String(transactions.length || 1482)
    : String(filteredTransactions.length)

  const txCardSubtitle = isAll
    ? '92% auto-categorized'
    : `${filteredTransactions.filter((t) => t.needs_review).length} need review`

  const alertsCount = isAll
    ? needsReviewCount || transactions.filter((t) => t.needs_review).length
    : filteredTransactions.filter((t) => t.needs_review).length

  const getSparklineData = (type) => {
    if (type === 'budget') {
      return [{ v: 40 }, { v: 55 }, { v: 70 }, { v: 85 }, { v: utilizationPercent }]
    }

    if (type === 'expenses') {
      return [{ v: 10 }, { v: 45 }, { v: 30 }, { v: 80 }, { v: 62 }]
    }

    if (type === 'transactions') {
      return [{ v: 100 }, { v: 220 }, { v: 180 }, { v: 310 }, { v: 280 }]
    }

    return [{ v: 5 }, { v: 12 }, { v: 8 }, { v: 15 }, { v: alertsCount }]
  }

  const getTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

    if (isAll && isOffline) {
      return [
        { name: 'Jan', Budget: 40000, Actual: 32000 },
        { name: 'Feb', Budget: 58000, Actual: 48000 },
        { name: 'Mar', Budget: 47000, Actual: 43000 },
        { name: 'Apr', Budget: 78000, Actual: 72000 },
        { name: 'May', Budget: 95000, Actual: 88000 },
        { name: 'Jun', Budget: 82000, Actual: 79000 },
      ]
    }

    const baseBudget = budgetTotal / 6
    const baseSpent = spentTotal / 6

    return months.map((m, index) => {
      const factor = 0.7 + index * 0.1

      return {
        name: m,
        Budget: Math.round(baseBudget * factor),
        Actual: Math.round(baseSpent * factor * (index === 5 ? 1.05 : 0.95)),
      }
    })
  }

  const getCategoryBreakdown = () => {
    const breakdown = {}
    let totalExpense = 0

    filteredTransactions.forEach((t) => {
      const cat = t.category || 'Other'
      const amt = Number(t.amount || 0)

      breakdown[cat] = (breakdown[cat] || 0) + amt
      totalExpense += amt
    })

    if (totalExpense === 0) {
      return [
        { name: 'Labor & Contracting', amount: 340.0, percent: 43, color: 'bg-cyan-500' },
        { name: 'Raw Materials', amount: 210.0, percent: 26.5, color: 'bg-emerald-500' },
        { name: 'Equipment Rental', amount: 155.5, percent: 19.7, color: 'bg-orange-500' },
        { name: 'Logistics & Fuel', amount: 84.5, percent: 10.8, color: 'bg-slate-400' },
      ]
    }

    const colors = [
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-orange-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-slate-400',
    ]

    return Object.keys(breakdown)
      .map((name, i) => {
        const amount = breakdown[name]
        const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0

        return {
          name,
          amount,
          percent,
          color: colors[i % colors.length],
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }

  const getActivities = () => {
    if (filteredTransactions.length > 0) {
      return filteredTransactions.slice(0, 4).map((t, idx) => {
        const icons = [FileText, Layers3, Wallet, ClipboardList]
        const bgs = [
          'bg-cyan-50 text-cyan-600',
          'bg-emerald-50 text-emerald-600',
          'bg-amber-50 text-amber-600',
          'bg-slate-100 text-slate-600',
        ]

        return {
          id: t.id || idx,
          title: t.description,
          text: `Amount: $${Number(t.amount).toLocaleString()} - ${formatDate(t.date)}`,
          badge: t.needs_review ? 'Pending Review' : 'Verified',
          icon: icons[idx % icons.length],
          iconClass: bgs[idx % bgs.length],
        }
      })
    }

    return [
      {
        id: 1,
        title: 'Site Survey Report #42',
        text: 'Updated 2h ago - Taleh Construction',
        badge: 'Excel Ready',
        icon: FileText,
        iconClass: 'bg-emerald-50 text-emerald-600',
      },
      {
        id: 2,
        title: 'Weekly Finance Sync',
        text: 'Automated run - Completed',
        badge: 'Saved',
        icon: RefreshCcw,
        iconClass: 'bg-cyan-50 text-cyan-600',
      },
      {
        id: 3,
        title: 'Material Invoice Upload',
        text: 'Processing 4 items...',
        badge: 'Pending',
        icon: Layers3,
        iconClass: 'bg-amber-50 text-amber-600',
      },
      {
        id: 4,
        title: 'New Collaborator Added',
        text: 'Sarah J. joined Project X',
        badge: 'Access',
        icon: UserPlus,
        iconClass: 'bg-slate-100 text-slate-600',
      },
    ]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl text-xs">
          <p className="font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider text-[10px]">
            {label}
          </p>

          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || item.stroke }}
              />

              <span className="font-semibold text-slate-300">
                {item.name}:{' '}
                <span className="font-black text-white">
                  ${Number(item.value).toLocaleString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCcw className="h-10 w-10 animate-spin text-cyan-600" />
        <p className="text-sm font-bold text-slate-500">
          Loading enterprise metrics...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/10">
              <LayoutDashboard size={24} />
            </div>

            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Overview Dashboard
              </h2>
            </div>

            {isOffline ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-black text-amber-700 ring-1 ring-inset ring-amber-600/10">
                <WifiOff size={11} className="text-amber-500 animate-pulse" />
                Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                <Wifi size={11} className="text-emerald-500" />
                Live Sync
              </span>
            )}
          </div>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Welcome back,{' '}
            <span className="font-extrabold text-slate-700">{authUser?.name || 'Administrator'}</span> -
            Analytics for{' '}
            <span className="font-extrabold text-slate-700">
              {isAll ? 'All Construction Projects' : selectedProject?.project_name}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3.5 text-sm font-extrabold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>

            <Compass
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 border-l border-slate-200 pl-2 text-slate-400">
              ?
            </div>
          </div>

          <button
            onClick={() => fetchData(true)}
            className="rounded-xl border border-slate-200 bg-white p-3.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition active:scale-95"
            title="Refresh statistics"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <Link to="/add-report" className="btn btn-primary">
            <Plus size={18} />
            Add Report
          </Link>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="card overflow-hidden p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/10">
                <Building2 size={26} />
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  Current Company Workspace
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  {companyName}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  This dashboard is filtered by the logged-in company only.
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${
                companyStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                  : 'bg-slate-100 text-slate-600 ring-slate-600/10'
              }`}
            >
              {companyStatus === 'active' ? 'Active Company' : companyStatus}
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600/10">
              <ShieldCheck size={23} />
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Access Role
              </p>
              <p className="mt-2 text-2xl font-black capitalize text-slate-950">
                {userRole}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Your dashboard data is private to this company workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-6 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-200/50 group">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition duration-300">
              <Compass size={22} />
            </div>

            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-700">
              Utilization
            </span>
          </div>

          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Budget Utilization
          </p>

          <h3 className="mt-1 text-3xl font-black text-slate-950">
            {utilizationPercent.toFixed(1)}%
          </h3>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Spent: ${Math.round(spentTotal).toLocaleString()}</span>
            <span>Total: ${Math.round(budgetTotal).toLocaleString()}</span>
          </div>

          <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100/70 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        <div className="card p-6 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/50 group">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:scale-110 transition duration-300">
              <Wallet size={22} />
            </div>

            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600">
              +12% MoM
            </span>
          </div>

          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Active Outflow
          </p>

          <h3 className="mt-1 text-3xl font-black text-slate-950">
            ${Math.round(cardExpenses).toLocaleString()}
          </h3>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            Summed current month transactions
          </p>

          <div className="mt-4 flex h-6 items-end gap-1">
            {getSparklineData('expenses').map((item, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-sm bg-orange-100 hover:bg-orange-400 transition"
                style={{ height: `${item.v}%` }}
              />
            ))}
          </div>
        </div>

        <div className="card p-6 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200/50 group">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition duration-300">
              <ClipboardList size={22} />
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Financials
            </span>
          </div>

          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Audit Transactions
          </p>

          <h3 className="mt-1 text-3xl font-black text-slate-950">
            {txCardValue}
          </h3>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {txCardSubtitle}
          </p>

          <div className="mt-4 flex h-6 items-end gap-1">
            {getSparklineData('transactions').map((item, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-sm bg-emerald-100 hover:bg-emerald-400 transition"
                style={{ height: `${item.v / 4}%` }}
              />
            ))}
          </div>
        </div>

        <div className="card p-6 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200/50 group">
          <div className="flex items-start justify-between">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${statusBg} ${statusColor} group-hover:scale-110 transition duration-300`}
            >
              {selectedProjectId === 'all' ? (
                <Layers3 size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                alertsCount > 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {alertsCount > 0 ? `${alertsCount} Warning` : 'Optimal'}
            </span>
          </div>

          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {isAll ? 'Active Node Count' : 'Project Status'}
          </p>

          <h3 className="mt-1 text-3xl font-black text-slate-950">
            {activeCardValue}
          </h3>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {activeCardSubtitle}
          </p>

          <div className="mt-4 flex h-6 items-end gap-1">
            {getSparklineData('alerts').map((item, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-sm transition ${
                  alertsCount > 0
                    ? 'bg-amber-100 hover:bg-amber-400'
                    : 'bg-indigo-100 hover:bg-indigo-400'
                }`}
                style={{ height: `${item.v * 15}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Financial Trend Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Monthly project budgeting vs actual resource spending
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-black text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#0891b2]" />
                Budget
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#4f46e5]" />
                Actual Spent
              </span>
            </div>
          </div>

          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={getTrendData()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  name="Budget"
                  type="monotone"
                  dataKey="Budget"
                  stroke="#0891b2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBudget)"
                />

                <Area
                  name="Actual Spent"
                  type="monotone"
                  dataKey="Actual"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Project Health</h3>
            <p className="text-xs text-slate-400">
              Total project spending limits indicator
            </p>
          </div>

          <div className="relative flex justify-center mt-6">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={[
                    { value: utilizationPercent },
                    { value: Math.max(0, 100 - utilizationPercent) },
                  ]}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="url(#gaugeCyanGrad)" />
                  <Cell fill="#f1f5f9" />
                </Pie>

                <defs>
                  <linearGradient id="gaugeCyanGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 leading-none">
                {utilizationPercent.toFixed(0)}%
              </span>

              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1.5">
                Utilized
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-slate-500">
            {utilizationPercent > 90
              ? 'Warning: Spent amounts are nearing budget limits!'
              : 'Budget usage is within optimal range for current timeline.'}
          </p>

          <Link
            to="/reports"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <TrendingUp size={15} />
            View Detailed Audit Logs
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Expense Allocation
              </h3>
              <p className="text-xs text-slate-400">
                Category breakdown of transactions
              </p>
            </div>

            <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">
              Monthly breakdown
            </span>
          </div>

          <div className="mt-8 space-y-6">
            {getCategoryBreakdown().map((item, idx) => (
              <div
                key={item.name}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-extrabold text-slate-700">{item.name}</p>

                  <p className="font-extrabold text-slate-950">
                    ${Number(item.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{' '}
                    ({item.percent.toFixed(1)}%)
                  </p>
                </div>

                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Activity & Logs
              </h3>
              <p className="text-xs text-slate-400">
                Parsed items and sync stream
              </p>
            </div>

            <Link
              to="/reports"
              className="text-xs font-black text-[#007c8f] hover:underline flex items-center gap-1"
            >
              View All Reports
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {getActivities().map((item, idx) => {
              const Icon = item.icon

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl p-2 hover:bg-slate-50 transition duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 75}ms` }}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {item.text}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                      item.badge === 'Pending' || item.badge === 'Pending Review'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10'
                        : item.badge === 'Access'
                          ? 'bg-slate-100 text-slate-700'
                          : item.badge === 'Saved' || item.badge === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10'
                            : 'bg-cyan-50 text-cyan-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
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
