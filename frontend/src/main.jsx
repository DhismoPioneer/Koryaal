import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Building2,
  Wallet,
  Settings as SettingsIcon,
  Users as UsersIcon,
  HelpCircle,
  LogOut,
  Bell,
  UserCircle,
  Menu,
  X,
  Plus,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Smartphone,
  HardHat,
  Search,
  CheckCircle2,
  PlusCircle,
  FileText,
  Paperclip,
  UserPlus,
} from 'lucide-react'

import './index.css'

import AddReport from './pages/AddReport.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import Reports from './pages/Reports.jsx'
import HowToUse from './pages/HowToUse.jsx'
import UsersPage from './pages/Users.jsx'
import Login from './pages/Login.jsx'
import SettingsPage from './pages/Settings.jsx'
import api from './services/api'
import ManualReport from './pages/ManualReport.jsx'
import AddProject from './pages/AddProject.jsx'
import CompleteProjects from './pages/CompleteProjects.jsx'
import ProjectCashflow from './pages/ProjectCashflow.jsx'
import InvoiceAttachments from './pages/InvoiceAttachments.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import VerifyResetCode from './pages/VerifyResetCode.jsx'
import ResetPassword from './pages/ResetPassword.jsx'

const defaultPermissionsByRole = {
  admin: [
    'dashboard.view',
    'projects.view',
    'projects.manage',
    'projects.complete',
    'reports.create',
    'reports.view',
    'reports.approve',
    'finance.view',
    'excel.export',
    'users.manage',
  ],
  finance: ['dashboard.view', 'reports.create', 'projects.view', 'reports.view', 'reports.approve', 'finance.view', 'excel.export'],
  engineer: ['projects.view', 'reports.create', 'reports.view_own'],
  client: ['projects.view', 'client.progress.view'],
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000
const TOKEN_STORAGE_KEY = 'koryaal_token'
const USER_STORAGE_KEY = 'koryaal_user'
const LAST_ACTIVITY_STORAGE_KEY = 'koryaal_last_activity'

function App() {
  const [authUser, setAuthUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const idleTimerRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY))

    const clearStoredSession = () => {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY)
    }

    if (!token || !storedUser || token.startsWith('demo-')) {
      clearStoredSession()
      setCheckingAuth(false)
      return
    }

    if (lastActivity && Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
      api.post('/logout').catch((error) => console.error(error))
      clearStoredSession()
      setCheckingAuth(false)
      return
    }

    try {
      setAuthUser(JSON.parse(storedUser))
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()))
    } catch (error) {
      console.error(error)
      clearStoredSession()
    }

    setCheckingAuth(false)
  }, [])

  const handleLogin = ({ token, user }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()))
    setAuthUser(user)
  }

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error(error)
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY)
      setAuthUser(null)
    }
  }

  useEffect(() => {
    if (!authUser) return undefined

    const resetIdleTimer = () => {
      window.clearTimeout(idleTimerRef.current)
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()))
      idleTimerRef.current = window.setTimeout(() => {
        handleLogout()
      }, IDLE_TIMEOUT_MS)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true })
    })

    resetIdleTimer()

    return () => {
      window.clearTimeout(idleTimerRef.current)
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  const handleUserUpdate = (user) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    setAuthUser(user)
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-extrabold text-slate-600 shadow-sm">
          Loading Koryaal...
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-code" element={<VerifyResetCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout
      authUser={authUser}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  )
}

function SidebarNavigation({ items, pathname, openMenus, onToggle, onNavigate, idPrefix = 'desktop' }) {
  const linkClasses = isActive => `group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${isActive ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400' : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'}`
  return items.map(item => {
    const Icon = item.icon
    if (!item.children) {
      return <NavLink key={item.to} to={item.to} end onClick={onNavigate} className={({ isActive }) => linkClasses(isActive)}><Icon size={18} /><span>{item.label}</span></NavLink>
    }
    const active = item.children.some(child => child.to === pathname)
    const expanded = Boolean(openMenus[item.key])
    const submenuId = `${idPrefix}-${item.key}-submenu`
    return (
      <div key={item.key} className="space-y-1">
        <button type="button" onClick={() => onToggle(item.key)} aria-expanded={expanded} aria-controls={submenuId} className={`${linkClasses(active)} w-full justify-between`}>
          <span className="flex items-center gap-3"><Icon size={18} /><span>{item.label}</span></span>
          <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <div id={submenuId} className="ml-5 space-y-1 border-l border-slate-700 pl-2">
            {item.children.map(child => {
              const ChildIcon = child.icon
              return <NavLink key={child.to} to={child.to} end onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition ${isActive ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}><ChildIcon size={15} /><span>{child.label}</span></NavLink>
            })}
          </div>
        )}
      </div>
    )
  })
}

function AppLayout({ authUser, onLogout, onUserUpdate }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState({})

  const role = authUser?.role || 'client'
  const permissions = authUser?.permissions || defaultPermissionsByRole[role] || []
  const hasPermission = (permission) => role === 'admin' || permissions.includes(permission)

  const canManageUsers = hasPermission('users.manage')
  const canViewFinancials = hasPermission('finance.view')
  const canSubmitReports = hasPermission('reports.create')
  const canViewDashboard = hasPermission('dashboard.view')

  const canUseFinancials = canViewFinancials || canSubmitReports
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, show: canViewDashboard },
    {
      key: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      show: hasPermission('projects.view'),
      children: [
        { to: '/projects', label: 'View Projects', icon: FolderKanban, show: hasPermission('projects.view') },
        { to: '/projects/add', label: 'Add Project', icon: PlusCircle, show: hasPermission('projects.manage') },
        { to: '/projects/cashflow', label: 'Deposit / Withdraw', icon: Wallet, show: canViewFinancials },
        { to: '/projects/complete', label: 'Complete Project', icon: CheckCircle2, show: hasPermission('projects.complete') },
      ].filter((child) => child.show),
    },
    {
      key: 'financials',
      label: 'Financials',
      icon: ClipboardList,
      show: canUseFinancials,
      children: [
        { to: '/add-report', label: 'WhatsApp Report', icon: Wallet, show: canSubmitReports },
        { to: '/manual-report', label: 'Manual Entry', icon: FileText, show: canViewFinancials },
        { to: '/reports', label: 'Reports', icon: ClipboardList, show: canViewFinancials },
        { to: '/invoices', label: 'Invoices', icon: Paperclip, show: canViewFinancials },
      ].filter((child) => child.show),
    },
    {
      key: 'users',
      label: 'Users',
      icon: UsersIcon,
      show: canManageUsers,
      children: [
        { to: '/users', label: 'View Users', icon: UsersIcon, show: canManageUsers },
        { to: '/users/add', label: 'Add User', icon: UserPlus, show: canManageUsers },
      ].filter((child) => child.show),
    },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: true },
  ].filter((item) => item.show)


  useEffect(() => {
    const group = nav.find(item => item.children?.some(child => child.to === location.pathname))
    setOpenMenus(group ? { [group.key]: true } : {})
    setMobileMenuOpen(false)
  }, [location.pathname])

  const logout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  const roleColors = {
    admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    engineer: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    finance: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    client: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-cyan-500/20 selection:text-cyan-900">
      {/* ============================================================== */}
      {/* DESKTOP ARCHITECTURAL SIDEBAR                                   */}
      {/* ============================================================== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800/80 bg-[#0B0F19] text-white lg:flex lg:flex-col">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 blueprint-grid-dark opacity-40" />

        {/* Brand identity header */}
        <div className="relative z-10 px-6 py-6 border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-sky-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-300/30 transition-transform group-hover:scale-105">
              <Building2 size={22} className="stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-xl font-black tracking-tight text-white group-hover:text-cyan-400 transition">
                  Koryaal
                </span>
                <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 truncate max-w-[140px]">
                {authUser?.company?.name || 'Civil Engineering'}
              </p>
            </div>
          </Link>
        </div>

        {/* Active Role Card & Switcher */}
        <div className="relative z-10 px-4 pt-4 pb-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Role</span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${roleColors[role] || 'text-slate-300'}`}>
                {role}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-200 truncate">{authUser?.name}</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="relative z-10 mt-3 flex-1 space-y-1.5 px-4 overflow-y-auto">
          <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Navigation
          </div>

          <SidebarNavigation items={nav} pathname={location.pathname} openMenus={openMenus} onToggle={key => setOpenMenus(previous => ({ [key]: !previous[key] }))} />
        </nav>

        {/* Desktop Sidebar Footer */}
        <div className="relative z-10 border-t border-slate-800/70 p-4 space-y-2">
          <Link
            to="/how-to-use"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
          >
            <HelpCircle size={16} className="text-slate-400" />
            Field Guide & Help
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE STICKY TOP BAR                                          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-black shadow-md shadow-cyan-600/20">
            <Building2 size={19} />
          </div>
          <div>
            <span className="font-heading text-lg font-black tracking-tight text-slate-900">Koryaal</span>
            <span className="ml-1.5 rounded bg-cyan-50 px-1 py-0.5 text-[9px] font-mono font-bold text-cyan-700">v2.0</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition active:scale-95"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MOBILE SLIDE-OVER DRAWER                                       */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-[#0B0F19] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">
                  <Building2 size={19} />
                </div>
                <span className="font-heading text-lg font-black text-white">Koryaal Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* User card in mobile drawer */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Role</span>
                <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${roleColors[role] || ''}`}>
                  {role}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-white">{authUser?.name}</p>
              <p className="text-xs text-slate-400">{authUser?.company?.name}</p>
            </div>

            {/* Mobile Nav Links */}
            <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
              <SidebarNavigation items={nav} pathname={location.pathname} openMenus={openMenus} onToggle={key => setOpenMenus(previous => ({ [key]: !previous[key] }))} onNavigate={() => setMobileMenuOpen(false)} idPrefix="mobile" />
            </nav>

            {/* Mobile Footer */}
            <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/how-to-use"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <HelpCircle size={16} /> Field Guide
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DESKTOP TOP BAR                                                */}
      {/* ============================================================== */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace:</span>
              <strong className="text-slate-900">{authUser?.company?.name || 'Koryaal Civil'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="badge-tag bg-cyan-50 text-cyan-800 capitalize">{role}</span>

            {canSubmitReports && (
              <Link
                to="/add-report"
                className="btn btn-primary text-xs py-2 px-3.5 shadow-sm"
              >
                <Plus size={15} />
                <span>Add Report</span>
              </Link>
            )}

            <div className="h-6 w-px bg-slate-200" />

            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 font-heading font-black text-white text-sm shadow-sm">
                {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-extrabold leading-none text-slate-900">{authUser?.name}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* MAIN PAGE CONTAINER                                            */}
        {/* ============================================================== */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-28 lg:pb-12">
          <Routes>
            <Route
              path="/"
              element={canViewDashboard ? <Dashboard authUser={authUser} /> : <Projects authUser={authUser} />}
            />
            <Route
              path="/projects"
              element={hasPermission('projects.view') ? <Projects authUser={authUser} /> : <Navigate to="/settings" replace />}
            />
            <Route
              path="/add-report"
              element={canSubmitReports ? <AddReport /> : <Navigate to="/projects" replace />}
            />
            <Route
              path="/reports"
              element={canViewFinancials ? <Reports /> : <Navigate to="/projects" replace />}
            />
            <Route
              path="/users"
              element={canManageUsers ? <UsersPage /> : <Navigate to="/projects" replace />}
            />
            <Route
              path="/settings"
              element={<SettingsPage authUser={authUser} onUserUpdate={onUserUpdate} />}
            />
            <Route path="/projects/add" element={hasPermission('projects.manage') ? <AddProject /> : <Navigate to="/projects" replace />} />
            <Route path="/projects/cashflow" element={canViewFinancials ? <ProjectCashflow /> : <Navigate to="/projects" replace />} />
            <Route path="/projects/complete" element={hasPermission('projects.complete') ? <CompleteProjects /> : <Navigate to="/projects" replace />} />
            <Route path="/manual-report" element={canViewFinancials ? <ManualReport /> : <Navigate to="/projects" replace />} />
            <Route path="/invoices" element={canViewFinancials ? <InvoiceAttachments /> : <Navigate to="/projects" replace />} />
            <Route path="/users/add" element={canManageUsers ? <UsersPage mode="add" /> : <Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE THUMB-FRIENDLY FLOATING BOTTOM BAR                      */}
      {/* ============================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 bg-white/95 px-3 py-1.5 backdrop-blur-lg lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around">
          {canViewDashboard && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold transition ${
                  isActive ? 'text-cyan-700' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <LayoutDashboard size={19} />
              <span>Overview</span>
            </NavLink>
          )}

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold transition ${
                isActive ? 'text-cyan-700' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <FolderKanban size={19} />
            <span>Projects</span>
          </NavLink>

          {/* Elevated Center "Add Report" Quick Button */}
          {canSubmitReports && (
            <NavLink
              to="/add-report"
              className={({ isActive }) =>
                `-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg shadow-cyan-700/30 ring-4 ring-white transition active:scale-95 ${
                  isActive ? 'bg-cyan-600 ring-cyan-100' : ''
                }`
              }
              title="Add WhatsApp Report"
            >
              <Plus size={24} className="stroke-[2.5]" />
            </NavLink>
          )}

          {canViewFinancials && (
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold transition ${
                  isActive ? 'text-cyan-700' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <ClipboardList size={19} />
              <span>Financials</span>
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold text-slate-500 hover:text-slate-800"
          >
            <Menu size={19} />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
