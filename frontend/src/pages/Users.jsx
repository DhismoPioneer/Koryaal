import React, { useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon,
  UserPlus,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
  Save,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  FolderKanban,
  KeyRound,
  CalendarClock,
} from 'lucide-react'
import api from '../services/api'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'engineer',
  status: 'active',
  project_ids: [],
  role_on_project: '',
  permissions: [],
}

const roleLabels = {
  admin: 'Admin / Owner',
  engineer: 'Engineer / Site Reporter',
  finance: 'Finance / Accountant',
  client: 'Client',
}

const formatDateTime = (value) => {
  if (!value) return 'Not updated yet'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const defaultPermissions = {
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
  engineer: ['projects.view', 'reports.create', 'reports.view_own'],
  finance: ['dashboard.view', 'projects.view', 'reports.view', 'reports.approve', 'finance.view', 'excel.export'],
  client: ['projects.view', 'client.progress.view'],
}

const permissionGroups = [
  {
    title: 'Projects',
    items: [
      ['projects.view', 'View assigned projects'],
      ['projects.manage', 'Create, edit, delete projects'],
      ['projects.complete', 'Mark projects completed'],
      ['client.progress.view', 'Client progress-only view'],
    ],
  },
  {
    title: 'Reports & Finance',
    items: [
      ['reports.create', 'Add engineer reports'],
      ['reports.view', 'View company reports'],
      ['reports.view_own', 'View only own reports'],
      ['reports.approve', 'Approve or reject reports'],
      ['finance.view', 'View financial dashboard and transactions'],
      ['excel.export', 'Export Excel reports'],
    ],
  },
  {
    title: 'Administration',
    items: [
      ['dashboard.view', 'View dashboard'],
      ['users.manage', 'Manage users and roles'],
    ],
  },
]

export default function Users({ mode = 'list' }) {
  const isAddMode = mode === 'add'
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(isAddMode)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setNotice(null)

    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
      ])

      setUsers(usersResponse.data || [])
      setProjects(projectsResponse.data || [])
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text: 'Could not load users or projects. Make sure the Laravel backend is running and migrations are complete.',
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      admins: users.filter((user) => user.role === 'admin').length,
      assigned: users.filter((user) => (user.projects || []).length > 0).length,
    }
  }, [users])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'role' ? { permissions: defaultPermissions[value] || [] } : {}),
    }))
  }

  const togglePermission = (permission) => {
    setForm((previous) => {
      const exists = previous.permissions.includes(permission)

      return {
        ...previous,
        permissions: exists
          ? previous.permissions.filter((item) => item !== permission)
          : [...previous.permissions, permission],
      }
    })
  }

  const handleProjectsChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => Number(option.value))
    setForm((previous) => ({ ...previous, project_ids: selected }))
  }

  const openNewUser = () => {
    setEditingUser(null)
    setForm({ ...emptyForm, permissions: defaultPermissions.engineer })
    setShowForm(true)
    setNotice(null)
  }

  const resetForm = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setShowForm(false)
  }

  const startEdit = (user) => {
    setEditingUser(user)
    setShowForm(true)
    setNotice(null)

    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'engineer',
      status: user.status || 'active',
      project_ids: (user.projects || []).map((project) => project.id),
      role_on_project: user.projects?.[0]?.pivot?.role_on_project || '',
      permissions: user.permissions || defaultPermissions[user.role || 'engineer'] || [],
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitUser = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    try {
      if (!form.name.trim() || !form.email.trim()) {
        setNotice({ type: 'warning', text: 'Name and email are required.' })
        setSaving(false)
        return
      }

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        status: form.status,
        project_ids: form.project_ids,
        role_on_project: form.role_on_project || null,
        permissions: form.permissions,
      }

      if (form.password.trim()) {
        payload.password = form.password
      }

      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload)
        setNotice({ type: 'success', text: 'User updated successfully.' })
      } else {
        await api.post('/users', payload)
        setNotice({ type: 'success', text: 'User created successfully.' })
      }

      if (isAddMode) {
        setEditingUser(null)
        setForm({ ...emptyForm, permissions: defaultPermissions.engineer })
        setShowForm(true)
      } else {
        resetForm()
      }

      loadData()
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'warning',
        text:
          error?.response?.data?.message ||
          'Could not save user. Check validation rules and database migrations.',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active'

    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus })
      setNotice({
        type: 'success',
        text: `${user.name} is now ${nextStatus}.`,
      })
      loadData()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: 'Could not update user status.' })
    }
  }

  const deleteUser = async (user) => {
    const ok = window.confirm(`Delete user: ${user.name}?`)
    if (!ok) return

    try {
      await api.delete(`/users/${user.id}`)
      setNotice({ type: 'success', text: 'User deleted successfully.' })
      loadData()
    } catch (error) {
      console.error(error)
      setNotice({ type: 'warning', text: 'Could not delete user.' })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="page-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_35%)]" />

        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <ShieldCheck size={14} />
              {isAddMode ? 'Add User' : 'Users'} and Role Access
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
              {isAddMode ? 'Add User' : 'Users'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {isAddMode ? 'Create a team member, assign their role, permissions, and project access.' : 'Manage team members, project visibility, account status, and role-based permissions for BuildTrack AI.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-white/20 active:scale-95"
            >
              <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {!isAddMode && (
            <button
              onClick={openNewUser}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-cyan-600 active:scale-95"
            >
              <UserPlus size={18} />
              Add User
            </button>
            )}
          </div>
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

      {!isAddMode && (
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} icon={UsersIcon} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard label="Active Accounts" value={stats.active} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Admins" value={stats.admins} icon={ShieldCheck} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Assigned Users" value={stats.assigned} icon={FolderKanban} color="text-amber-600" bg="bg-amber-50" />
      </section>
      )}

      {(showForm || isAddMode) && (
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Assign system role, account status, and project access.
              </p>
            </div>
            <button
              type="button"
              onClick={isAddMode ? () => setForm({ ...emptyForm, permissions: defaultPermissions.engineer }) : resetForm}
              className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition hover:bg-slate-200"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={submitUser} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Full Name" icon={UsersIcon}>
                <input
                  name="name"
                  className="input"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Ahmed Hassan"
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <input
                  name="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Phone" icon={Phone}>
                <input
                  name="phone"
                  className="input"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+252..."
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Role" icon={ShieldCheck}>
                <select name="role" className="input" value={form.role} onChange={handleChange}>
                  <option value="admin">Admin / Owner</option>
                  <option value="engineer">Engineer / Site Reporter</option>
                  <option value="finance">Finance / Accountant</option>
                  <option value="client">Client</option>
                </select>
              </Field>

              <Field label="Status" icon={CheckCircle2}>
                <select name="status" className="input" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>

              <Field label={editingUser ? 'New Password Optional' : 'Password Optional'} icon={KeyRound}>
                <input
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Default: password123'}
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <Field label="Assigned Projects" icon={FolderKanban}>
                <select
                  multiple
                  className="input min-h-36 py-3"
                  value={form.project_ids.map(String)}
                  onChange={handleProjectsChange}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Role On Project" icon={ShieldCheck}>
                <input
                  name="role_on_project"
                  className="input"
                  value={form.role_on_project}
                  onChange={handleChange}
                  placeholder="e.g. Site engineer"
                />
              </Field>
            </div>

            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="mb-4">
                <h4 className="text-sm font-black text-slate-900">Frontend Access Checklist</h4>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Choose exactly what this user can see or do in this company workspace. Changes update the user record timestamp automatically.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {permissionGroups.map((group) => (
                  <div key={group.title} className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </p>

                    <div className="space-y-3">
                      {group.items.map(([permission, label]) => (
                        <label key={permission} className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-700">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            checked={form.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
              <button type="button" onClick={isAddMode ? () => setForm({ ...emptyForm, permissions: defaultPermissions.engineer }) : resetForm} className="btn btn-light">
                <X size={17} />
                {isAddMode ? 'Clear' : 'Cancel'}
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <Save size={17} />
                {saving ? 'Saving...' : editingUser ? 'Save User' : 'Create User'}
              </button>
            </div>
          </form>
        </section>
      )}

      {!isAddMode && (
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <h3 className="text-xl font-extrabold text-slate-900">User Directory</h3>
          <p className="mt-1 text-xs text-slate-400">
            Team members with role and project access assignments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 font-extrabold text-slate-500">
              <tr>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Name</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Email</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Phone</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Role</th>
                <th className="p-4 text-center text-[10px] font-black uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Assigned Projects</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider">Last Updated</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/30">
                  <td className="p-4 font-extrabold text-slate-950">{user.name}</td>
                  <td className="p-4 font-semibold text-slate-500">{user.email}</td>
                  <td className="p-4 font-semibold text-slate-500">{user.phone || 'N/A'}</td>
                  <td className="p-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="p-4">
                    <ProjectList projects={user.projects || []} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <CalendarClock size={14} className="text-slate-400" />
                      <span>{formatDateTime(user.updated_at)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                        title="Edit user"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => toggleStatus(user)}
                        className="rounded-lg bg-cyan-50 px-2.5 py-2 text-[11px] font-black text-cyan-700 ring-1 ring-cyan-500/10 transition hover:bg-cyan-100"
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        className="rounded-lg bg-rose-50 p-2 text-rose-600 ring-1 ring-rose-500/10 transition hover:bg-rose-100"
                        title="Delete user"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center font-bold text-slate-400">
                    No users found. Create your first team member to begin assigning project access.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card group flex items-center justify-between p-5 hover:-translate-y-0.5 hover:border-slate-200/50 hover:shadow-lg">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ${color} transition duration-300 group-hover:scale-110`}>
        <Icon size={21} />
      </div>
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

function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    engineer: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    finance: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    client: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${styles[role] || styles.engineer}`}>
      {roleLabels[role] || role}
    </span>
  )
}

function StatusBadge({ status }) {
  const isActive = status === 'active'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ring-inset ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
          : 'bg-slate-100 text-slate-600 ring-slate-600/10'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function ProjectList({ projects }) {
  if (!projects.length) {
    return <span className="text-xs font-bold text-slate-400">No projects assigned</span>
  }

  return (
    <div className="flex max-w-[320px] flex-wrap gap-1.5">
      {projects.slice(0, 3).map((project) => (
        <span key={project.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {project.project_name}
        </span>
      ))}
      {projects.length > 3 && (
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
          +{projects.length - 3}
        </span>
      )}
    </div>
  )
}






