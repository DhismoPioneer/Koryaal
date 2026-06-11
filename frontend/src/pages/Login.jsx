import React, { useState } from 'react'
import { Building2, KeyRound, Lock, Mail, LogIn, Phone, ShieldCheck } from 'lucide-react'
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <main className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-sm">
            <Building2 size={23} />
          </div>

          <h1 className="mt-4 text-xl font-black text-slate-950">BuildTrack AI</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Site Manager
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] sm:p-8">
          <div className="mb-6 text-center">
            <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700 ring-1 ring-cyan-600/10">
              {modeLabel}
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>

            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="mt-4 text-sm font-black text-cyan-700 transition hover:text-cyan-600 hover:underline"
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
        </section>
      </main>
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
