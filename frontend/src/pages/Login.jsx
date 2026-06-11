import React, { useState } from 'react'
import { Building2, CheckCircle2, KeyRound, Lock, Mail, LogIn, Phone, ShieldCheck } from 'lucide-react'
import api from '../services/api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')

  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    code: '',
  })

  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const getErrorMessage = (error, fallback) => {
    const apiMessage = error?.response?.data?.message
    const validationErrors = error?.response?.data?.errors

    if (apiMessage) return apiMessage

    if (validationErrors) {
      return Object.values(validationErrors).flat().join(' ')
    }

    if (error?.message === 'Network Error') {
      return `Network error. The frontend is trying to reach ${api.defaults.baseURL}. Check VITE_API_BASE_URL, backend server, and CORS settings.`
    }

    return fallback
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setNotice(null)

    setForm((previous) => ({
      ...previous,
      password: '',
      password_confirmation: '',
      code: '',
    }))
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/login', {
        email: form.email.trim(),
        password: form.password,
      })

      onLogin(data)
    } catch (error) {
      console.error(error)

      setNotice({
        type: 'warning',
        text: getErrorMessage(
          error,
          'Could not log in. Check your email, password, and backend server.'
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  const submitForgotPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/forgot-password', {
        email: form.email.trim(),
      })

      setNotice({
        type: 'success',
        text: data.local_reset_code
          ? `${data.message} Code: ${data.local_reset_code}`
          : data.message || 'Reset code sent. Check your email inbox.',
      })

      setMode('verify')
    } catch (error) {
      console.error(error)

      setNotice({
        type: 'warning',
        text: getErrorMessage(
          error,
          'Could not send reset code. Check your email and mail settings.'
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  const submitVerifyCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/verify-reset-code', {
        email: form.email.trim(),
        code: form.code.trim(),
      })

      setNotice({
        type: 'success',
        text: data.message || 'Code verified. You can now create a new password.',
      })

      setMode('reset')
    } catch (error) {
      console.error(error)

      setNotice({
        type: 'warning',
        text: getErrorMessage(error, 'Invalid or expired reset code.'),
      })
    } finally {
      setLoading(false)
    }
  }

  const submitResetPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    if (form.password.length < 8) {
      setNotice({
        type: 'warning',
        text: 'Password must be at least 8 characters.',
      })
      setLoading(false)
      return
    }

    if (form.password !== form.password_confirmation) {
      setNotice({
        type: 'warning',
        text: 'Password confirmation must match the new password.',
      })
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post('/reset-password', {
        email: form.email.trim(),
        code: form.code.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })

      setNotice({
        type: 'success',
        text: data.message || 'Password updated. Please sign in with your new password.',
      })

      setMode('login')

      setForm((previous) => ({
        ...previous,
        password: '',
        password_confirmation: '',
        code: '',
      }))
    } catch (error) {
      console.error(error)

      setNotice({
        type: 'warning',
        text: getErrorMessage(
          error,
          'Could not reset password. Check the code and password confirmation.'
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  const submitCompany = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    if (!form.company_name.trim()) {
      setNotice({ type: 'warning', text: 'Company name is required.' })
      setLoading(false)
      return
    }

    if (!form.company_email.trim()) {
      setNotice({ type: 'warning', text: 'Company email is required.' })
      setLoading(false)
      return
    }

    if (!form.name.trim()) {
      setNotice({ type: 'warning', text: 'Admin name is required.' })
      setLoading(false)
      return
    }

    if (!form.email.trim()) {
      setNotice({ type: 'warning', text: 'Admin email is required.' })
      setLoading(false)
      return
    }

    if (form.password.length < 8) {
      setNotice({
        type: 'warning',
        text: 'Password must be at least 8 characters.',
      })
      setLoading(false)
      return
    }

    if (form.password !== form.password_confirmation) {
      setNotice({
        type: 'warning',
        text: 'Confirm password must match password.',
      })
      setLoading(false)
      return
    }

    const payload = {
      company_name: form.company_name.trim(),
      company_email: form.company_email.trim(),
      company_phone: form.company_phone.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
    }

    try {
      const { data } = await api.post('/register-company', payload)
      onLogin(data)
    } catch (error) {
      console.error(error)

      setNotice({
        type: 'warning',
        text: getErrorMessage(
          error,
          'Could not create company. Check required fields and password length.'
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  const title = {
    login: 'Welcome back',
    register: 'Create your workspace',
    forgot: 'Reset your password',
    verify: 'Check your email',
    reset: 'Choose a new password',
  }[mode]

  const subtitle = {
    login: 'Sign in to manage projects, reports, payments, documents, and site activity.',
    register: 'Set up your company account and invite your team after the first login.',
    forgot: 'Enter your account email and we will send a secure reset code.',
    verify: 'Enter the 6-digit code sent to your registered inbox.',
    reset: 'Create a strong password to get back into your workspace.',
  }[mode]

  const modeLabel = {
    login: 'Sign in',
    register: 'New company',
    forgot: 'Password help',
    verify: 'Verification',
    reset: 'New password',
  }[mode]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.12),_transparent_28rem),linear-gradient(135deg,#f8fafc_0%,#eef6f8_52%,#f8fafc_100%)] px-4 py-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,_rgba(34,211,238,0.22),_transparent_28rem),radial-gradient(circle_at_8%_86%,_rgba(37,99,235,0.18),_transparent_26rem)]" />
          <div className="absolute inset-x-10 bottom-10 top-32 rounded-[2rem] border border-white/10 bg-white/[0.03]" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Building2 size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-cyan-100">BuildTrack AI</h1>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-300">
                  Site Manager
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <ShieldCheck size={14} />
                Secure construction workspace
              </div>

              <h2 className="text-4xl font-black leading-tight tracking-tight">
                Run your site operations from one clear dashboard.
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Keep projects, daily reports, transactions, invoices, messages, and team access organized without changing how your backend works.
              </p>

              <div className="mt-8 grid gap-3">
                {['Project progress and budgets', 'Daily reports and finance logs', 'Role-based access for every team'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100">
                    <CheckCircle2 size={17} className="text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <AuthMetric label="Projects" value="Live" />
              <AuthMetric label="Reports" value="Smart" />
              <AuthMetric label="Access" value="Secure" />
            </div>
          </div>
        </section>

        <section className="flex items-center p-5 sm:p-8 lg:p-10">
          <div className="w-full">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-700/20">
                <Building2 size={22} />
              </div>

              <div>
                <h1 className="text-xl font-black text-slate-950">BuildTrack AI</h1>
                <p className="text-xs font-semibold text-slate-500">Site Manager</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.5)] sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700 ring-1 ring-cyan-600/10">
                {modeLabel}
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
            </div>

            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                Back to sign in
              </button>
            )}
          </div>

          {notice && (
            <div
              className={`mb-6 rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${
                notice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                  : 'bg-amber-50 text-amber-700 ring-amber-600/10'
              }`}
            >
              {notice.text}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={submitLogin} className="space-y-5">
              <Field label="Email Address" icon={Mail}>
                <input
                  name="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field label="Password" icon={Lock}>
                <input
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                <LogIn size={18} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => changeMode('forgot')}
                className="block w-full text-center text-sm font-black text-cyan-700 transition hover:text-cyan-600 hover:underline"
              >
                Forgot password?
              </button>

              <button
                type="button"
                onClick={() => changeMode('register')}
                className="btn btn-light w-full border-dashed"
              >
                Create a new company workspace
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={submitForgotPassword} className="space-y-5">
              <Field label="Account Email" icon={Mail}>
                <input
                  name="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                <KeyRound size={18} />
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>

            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={submitVerifyCode} className="space-y-5">
              <Field label="Account Email" icon={Mail}>
                <input
                  name="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field label="Email Code" icon={KeyRound}>
                <input
                  name="code"
                  className="input tracking-[0.3em]"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                <KeyRound size={18} />
                {loading ? 'Checking code...' : 'Verify Code'}
              </button>

              <button type="button" onClick={() => changeMode('forgot')} className="btn btn-light w-full">
                Send New Code
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={submitResetPassword} className="space-y-5">
              <Field label="New Password" icon={Lock}>
                <input
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field label="Confirm New Password" icon={Lock}>
                <input
                  name="password_confirmation"
                  type="password"
                  className="input"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                <Lock size={18} />
                {loading ? 'Updating password...' : 'Update Password'}
              </button>

              <button type="button" onClick={() => changeMode('forgot')} className="btn btn-light w-full">Start Again</button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={submitCompany} className="space-y-5">
              <Field label="Company Name" icon={Building2}>
                <input
                  name="company_name"
                  className="input"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Hodan Construction"
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company Email" icon={Mail}>
                  <input
                    name="company_email"
                    type="email"
                    className="input"
                    value={form.company_email}
                    onChange={handleChange}
                    placeholder="office@company.com"
                    required
                  />
                </Field>

                <Field label="Company Phone" icon={Phone}>
                  <input
                    name="company_phone"
                    className="input"
                    value={form.company_phone}
                    onChange={handleChange}
                    placeholder="+252..."
                  />
                </Field>
              </div>

              <Field label="Admin Name" icon={ShieldCheck}>
                <input
                  name="name"
                  className="input"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Admin / Owner full name"
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Admin Email" icon={Mail}>
                  <input
                    name="email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@company.com"
                    required
                  />
                </Field>

                <Field label="Admin Phone" icon={Phone}>
                  <input
                    name="phone"
                    className="input"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+252..."
                  />
                </Field>
              </div>

              <Field label="Password" icon={Lock}>
                <input
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field label="Confirm Password" icon={Lock}>
                <input
                  name="password_confirmation"
                  type="password"
                  className="input"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                <Building2 size={18} />
                {loading ? 'Creating company...' : 'Create Company Workspace'}
              </button>

            </form>
          )}
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-slate-400">
            Protected workspace access for admins, engineers, finance teams, and clients.
          </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function AuthMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
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
