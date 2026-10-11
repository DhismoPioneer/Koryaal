import React, { useState } from 'react'
import { Building2, KeyRound, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/forgot-password', { email })
      sessionStorage.setItem('password_reset_email', email)
      setNotice({
        type: 'success',
        text: data.local_reset_code
          ? `${data.message} Code: ${data.local_reset_code}`
          : (data.message || 'If this email exists, a reset code has been sent.'),
      })
      window.setTimeout(() => navigate('/verify-reset-code'), 700)
    } catch (error) {
      setNotice({
        type: 'warning',
        text: error?.response?.data?.message || 'Could not send reset code. Check email configuration.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your registered account email. If it exists, a 6-digit code will be sent to that inbox.">
      {notice && <Notice notice={notice} />}
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="Registered Email" icon={Mail}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@company.com"
            autoComplete="email"
            required
          />
        </Field>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <KeyRound size={18} />
          {loading ? 'Sending code...' : 'Send Reset Code'}
        </button>

        <Link to="/login" className="btn btn-light w-full">Back to Login</Link>
      </form>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.55)] sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950">Koryaal</h1>
            <p className="text-xs font-semibold text-slate-500">Secure account recovery</p>
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, icon: Icon, children }) {
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

export function Notice({ notice }) {
  return (
    <div className={`mt-6 rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 'bg-amber-50 text-amber-700 ring-amber-600/10'}`}>
      {notice.text}
    </div>
  )
}
