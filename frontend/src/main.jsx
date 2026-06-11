import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  CheckCircle2,
  ClipboardList,
  Paperclip,
  ChevronDown,
  Building2,
  Wallet,
  FileText,
  Settings,
  Users,
  HelpCircle,
  LogOut,
  Bell,
  UserCircle,
  UserPlus,
  Menu,
  X,
} from 'lucide-react'

import './index.css'

import AddReport from './pages/AddReport.jsx'
import ManualReport from './pages/ManualReport.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import AddProject from './pages/AddProject.jsx'
import CompleteProjects from './pages/CompleteProjects.jsx'
import ProjectCashflow from './pages/ProjectCashflow.jsx'
import Reports from './pages/Reports.jsx'
import InvoiceAttachments from './pages/InvoiceAttachments.jsx'
import HowToUse from './pages/HowToUse.jsx'
import UsersPage from './pages/Users.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import VerifyResetCode from './pages/VerifyResetCode.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import SettingsPage from './pages/Settings.jsx'
import api from './services/api'

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
  finance: ['dashboard.view', 'projects.view', 'reports.create', 'reports.view', 'reports.approve', 'finance.view', 'excel.export'],
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

    if (!token || !storedUser) {
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
          Loading BuildTrack AI Site Manager...
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

function AppLayout({ authUser, onLogout, onUserUpdate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = authUser?.role || 'client'
  const permissions = authUser?.permissions || defaultPermissionsByRole[role] || []
  const hasPermission = (permission) => role === 'admin' || permissions.includes(permission)
  const canManageUsers = hasPermission('users.manage')
  const canViewFinancials = hasPermission('finance.view')
  const canSubmitReports = hasPermission('reports.create')
  const canViewDashboard = hasPermission('dashboard.view')
  const canUseFinancials = canViewFinancials || canSubmitReports
  const [openMenus, setOpenMenus] = useState({ projects: false, financials: false, users: false })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
      icon: Users,
      show: canManageUsers,
      children: [
        { to: '/users', label: 'View Users', icon: Users, show: canManageUsers },
        { to: '/users/add', label: 'Add User', icon: UserPlus, show: canManageUsers },
      ].filter((child) => child.show),
    },
    { to: '/settings', label: 'Settings', icon: Settings, show: true },
  ].filter((item) => item.show)

  const mobileNav = nav.flatMap((item) => item.children || [item])

  useEffect(() => {
    const activeMenu = nav.find((item) => item.children?.some((child) => location.pathname === child.to))

    if (activeMenu?.key) {
      setOpenMenus({ [activeMenu.key]: true })
    }
  }, [location.pathname])

  const logout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Building2 size={21} />
            </div>

            <div>
              <h1 className="text-base font-black leading-none text-cyan-100">
                BuildTrack AI
              </h1>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Site Manager
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const Icon = item.icon

            if (item.children) {
              const isMenuActive = item.children.some((child) => location.pathname === child.to)
              const isOpen = Boolean(openMenus[item.key])

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setOpenMenus({ [item.key]: !isOpen })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${
                      isMenuActive ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${isMenuActive ? 'bg-[#12b8d2] text-[#04111f]' : 'bg-white/5 text-[#4de7ff]'}`}>
                        <Icon size={18} />
                      </span>
                      {item.label}
                    </span>
                    <ChevronDown size={15} className={`transition ${isMenuActive ? 'text-[#4de7ff]' : 'text-slate-500'} ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="ml-5 space-y-1 border-l border-white/10 pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon

                        return (
                          <NavLink
                            key={`${child.to}-${child.label}`}
                            to={child.to}
                            end
                            className={({ isActive }) =>
                              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${
                                isActive
                                  ? 'bg-[#12b8d2] text-[#04111f] shadow-sm shadow-cyan-500/20'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <span className="absolute -left-[13px] top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#12b8d2]" />
                                )}
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-[#04111f]/10 text-[#04111f]' : 'bg-white/5 text-[#4de7ff]'}`}>
                                  <ChildIcon size={14} />
                                </span>
                                <span className="truncate">{child.label}</span>
                              </>
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpenMenus({ projects: false, financials: false, users: false })}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${
                    isActive
                      ? 'bg-white/10 text-[#4de7ff]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-3 h-8 w-1 rounded-full bg-[#13c7e0]" />
                    )}
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-[#12b8d2] text-[#04111f]' : 'bg-white/5 text-[#4de7ff]'}`}>
                      <Icon size={18} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-3 pb-5">
          <div className="border-t border-white/10 pt-4">
            <Link
              to="/how-to-use"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#4de7ff]">
                <HelpCircle size={17} />
              </span>
              Support
            </Link>

            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#4de7ff]">
                <LogOut size={17} />
              </span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-950">BuildTrack AI</h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                {authUser?.company?.name || 'Company Workspace'}
              </p>
            </div>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-4 ring-cyan-100">
            {authUser?.name ? (
              <span className="text-sm font-black">{authUser.name.slice(0, 1).toUpperCase()}</span>
            ) : (
              <UserCircle size={24} />
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative flex h-full w-[86vw] max-w-[340px] flex-col bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12b8d2] text-[#06101f]">
                  <Building2 size={21} />
                </div>
                <div>
                  <h1 className="text-base font-black leading-none text-[#41dff2]">BuildTrack AI</h1>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-300">
                    Site Manager
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-xl bg-white/10 p-2 text-slate-200"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
              {mobileNav.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={`${item.to}-${item.label}-drawer`}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                        isActive ? 'bg-[#12b8d2] text-[#04111f]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <Icon size={17} />
                    </span>
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <Link
                to="/how-to-use"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-300"
              >
                <HelpCircle size={17} />
                Support
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-300"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="lg:ml-[260px]">
        {/* Desktop Topbar */}
        <div className="sticky top-0 z-30 hidden border-b border-slate-200/70 bg-white/85 shadow-sm shadow-slate-950/[0.03] backdrop-blur lg:block">
          <div className="flex h-16 items-center justify-end px-5 xl:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>

                {canSubmitReports && (
                <Link
                  to="/add-report"
                  className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                >
                  WhatsApp Report
                </Link>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  {authUser?.name ? (
                    <span className="text-sm font-black">
                      {authUser.name.slice(0, 1).toUpperCase()}
                    </span>
                  ) : (
                    <UserCircle size={24} />
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="mx-auto w-full max-w-[1280px] px-4 py-5 pb-32 sm:px-5 lg:px-5 lg:py-6 lg:pb-8 xl:px-6">
          <Routes>
            <Route path="/" element={canViewDashboard ? <Dashboard authUser={authUser} /> : <Projects authUser={authUser} />} />
            <Route path="/projects" element={hasPermission('projects.view') ? <Projects authUser={authUser} /> : <Navigate to="/settings" replace />} />
            <Route path="/projects/add" element={hasPermission('projects.manage') ? <AddProject /> : <Navigate to="/projects" replace />} />
            <Route path="/projects/cashflow" element={canViewFinancials ? <ProjectCashflow /> : <Navigate to="/projects" replace />} />
            <Route path="/projects/complete" element={hasPermission('projects.complete') ? <CompleteProjects /> : <Navigate to="/projects" replace />} />
            <Route path="/add-report" element={canSubmitReports ? <AddReport /> : <Navigate to="/projects" replace />} />
            <Route path="/manual-report" element={canViewFinancials ? <ManualReport /> : <Navigate to="/projects" replace />} />
            <Route path="/reports" element={canViewFinancials ? <Reports /> : <Navigate to="/projects" replace />} />
            <Route path="/invoices" element={canViewFinancials ? <InvoiceAttachments /> : <Navigate to="/projects" replace />} />
            <Route
              path="/users"
              element={canManageUsers ? <UsersPage /> : <Navigate to="/projects" replace />}
            />
            <Route
              path="/users/add"
              element={canManageUsers ? <UsersPage mode="add" /> : <Navigate to="/projects" replace />}
            />
            <Route
              path="/settings"
              element={<SettingsPage authUser={authUser} onUserUpdate={onUserUpdate} />}
            />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur lg:hidden">
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={`${item.to}-${item.label}-mobile`}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpenMenus({ projects: false, financials: false, users: false })}
                className={({ isActive }) =>
                  `flex min-w-[78px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-black transition ${
                    isActive ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon size={17} />
                <span className="max-w-[72px] truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        <div className="grid grid-cols-2 border-t border-slate-100 bg-white">
          <Link
            to="/how-to-use"
            className="flex items-center justify-center gap-2 py-2.5 text-[11px] font-black text-slate-600"
          >
            <HelpCircle size={15} />
            Support
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 py-2.5 text-[11px] font-black text-slate-600"
          >
            <LogOut size={15} />
            Logout
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
































