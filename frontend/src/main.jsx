import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, ClipboardList, Wallet, Settings as SettingsIcon, Users as UsersIcon, CheckCircle2, PlusCircle, FileText, Paperclip, UserPlus, MessageSquare } from 'lucide-react'

import './index.css'

import AddReport from './pages/AddReport.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import Reports from './pages/Reports.jsx'
import HowToUse from './pages/HowToUse.jsx'
import UsersPage from './pages/Users.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import WorkspaceShell from './components/WorkspaceShell.jsx'
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
        <Route path="/" element={<Landing />} />
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
    { to: '/', label: 'Overview', icon: LayoutDashboard, show: canViewDashboard },
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
        { to: '/add-report', label: 'WhatsApp Report', icon: MessageSquare, show: canSubmitReports },
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
  }, [location.pathname])

  const logout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <WorkspaceShell authUser={authUser} nav={nav} openMenus={openMenus} setOpenMenus={setOpenMenus} onLogout={logout} canSubmitReports={canSubmitReports} canViewDashboard={canViewDashboard} canViewFinancials={canViewFinancials}>
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
    </WorkspaceShell>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
