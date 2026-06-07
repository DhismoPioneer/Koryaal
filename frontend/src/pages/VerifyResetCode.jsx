import React, { useEffect, useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthShell, Field, Notice } from './ForgotPassword.jsx'

export default function VerifyResetCode() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setEmail(sessionStorage.getItem('password_reset_email') || '')
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/verify-reset-code', { email, code })
      sessionStorage.setItem('password_reset_email', email)
      sessionStorage.setItem('password_reset_code', code)
      setNotice({ type: 'success', text: data.message || 'Code verified.' })
      window.setTimeout(() => navigate('/reset-password'), 500)
    } catch (error) {
      setNotice({
        type: 'warning',
        text: error?.response?.data?.message || 'Invalid or expired reset code.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Verify Email Code" subtitle="Enter the 6-digit code sent to the registered user email. Codes expire after 10 minutes and can be used once.">
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

        <Field label="6-Digit Code" icon={KeyRound}>
          <input
            className="input tracking-[0.3em]"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
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

        <Link to="/forgot-password" className="btn btn-light w-full">Send New Code</Link>
      </form>
    </AuthShell>
  )
}
