import React, { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthShell, Field, Notice } from './ForgotPassword.jsx'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setEmail(sessionStorage.getItem('password_reset_email') || '')
    setCode(sessionStorage.getItem('password_reset_code') || '')
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      const { data } = await api.post('/reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      })
      sessionStorage.removeItem('password_reset_email')
      sessionStorage.removeItem('password_reset_code')
      setNotice({ type: 'success', text: data.message || 'Password updated successfully.' })
      window.setTimeout(() => navigate('/login'), 900)
    } catch (error) {
      setNotice({
        type: 'warning',
        text: error?.response?.data?.message || 'Could not update password. Check the code and password confirmation.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create New Password" subtitle="Your code is verified. Create a new password for this account.">
      {notice && <Notice notice={notice} />}
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="New Password" icon={Lock}>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Confirm New Password" icon={Lock}>
          <input
            type="password"
            className="input"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
          />
        </Field>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <Lock size={18} />
          {loading ? 'Updating password...' : 'Update Password'}
        </button>

        <Link to="/forgot-password" className="btn btn-light w-full">Start Again</Link>
      </form>
    </AuthShell>
  )
}
