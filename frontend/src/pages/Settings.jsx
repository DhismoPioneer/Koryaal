import React, { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'
import api from '../services/api'

export default function Settings({ authUser, onUserUpdate }) {
  const [form, setForm] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const submitProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
      }

      if (form.password.trim()) {
        payload.current_password = form.current_password
        payload.password = form.password
        payload.password_confirmation = form.password_confirmation
      }

      const { data } = await api.patch('/me', payload)
      onUserUpdate(data)

      setForm((previous) => ({
        ...previous,
        current_password: '',
        password: '',
        password_confirmation: '',
      }))

      setNotice({
        type: 'success',
        text: 'Your profile information was updated successfully.',
      })
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text:
          error?.response?.data?.message ||
          'Could not update your profile. Check the fields and try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="page-hero p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
            <UserCircle size={14} />
            Account Settings
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
            My Profile
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            View your account, company workspace, role, and update your personal login information.
          </p>
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-2xl p-4 text-sm font-extrabold ring-1 ring-inset ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
              : 'bg-amber-50 text-amber-700 ring-amber-600/10'
          }`}
        >
          {notice.text}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-2xl font-black text-cyan-700 ring-4 ring-cyan-100">
              {(authUser?.name || 'U').slice(0, 1).toUpperCase()}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-950">{authUser?.name}</h3>
              <p className="text-xs font-semibold text-slate-500">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <InfoLine icon={ShieldCheck} label="Role" value={formatRole(authUser?.role)} />
            <InfoLine icon={CheckCircle2} label="Status" value={authUser?.status || 'active'} />
            <InfoLine icon={Building2} label="Company" value={authUser?.company?.name || 'Company Workspace'} />
          </div>
        </div>

        <form onSubmit={submitProfile} className="card space-y-6 p-6 lg:col-span-2">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-extrabold text-slate-900">Update Information</h3>
            <p className="mt-1 text-xs text-slate-400">
              Change your name, email, phone, or password.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full Name" icon={UserCircle}>
              <input name="name" className="input" value={form.name} onChange={handleChange} />
            </Field>

            <Field label="Email Address" icon={Mail}>
              <input name="email" type="email" className="input" value={form.email} onChange={handleChange} />
            </Field>

            <Field label="Phone" icon={Phone}>
              <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+252..." />
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-black text-slate-900">Change Password</h4>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Leave these fields blank if you do not want to change your password.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Current Password" icon={KeyRound}>
              <input
                name="current_password"
                type="password"
                className="input"
                value={form.current_password}
                onChange={handleChange}
              />
            </Field>

            <Field label="New Password" icon={KeyRound}>
              <input
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={handleChange}
              />
            </Field>

            <Field label="Confirm Password" icon={KeyRound}>
              <input
                name="password_confirmation"
                type="password"
                className="input"
                value={form.password_confirmation}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={17} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>
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

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
        <Icon size={13} />
        {label}
      </span>
      <span className="text-sm font-black capitalize text-slate-800">{value}</span>
    </div>
  )
}

function formatRole(role) {
  const labels = {
    admin: 'Admin / Owner',
    engineer: 'Engineer / Site Reporter',
    finance: 'Finance / Accountant',
    client: 'Client',
  }

  return labels[role] || role || 'User'
}
