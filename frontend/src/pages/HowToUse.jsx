import React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  HelpCircle,
  LockKeyhole,
  Paperclip,
  ShieldCheck,
  UserCog,
  Wallet,
} from 'lucide-react'

const workflowSteps = [
  {
    title: '1. Company Setup',
    text: 'Each company works in its own workspace. Admins, engineers, finance users, and clients only see the company data they belong to.',
    icon: ShieldCheck,
  },
  {
    title: '2. Users and Roles',
    text: 'Admins create users, choose a role, assign projects, and use the access checklist to decide what each person can view or manage.',
    icon: UserCog,
  },
  {
    title: '3. Projects',
    text: 'Create projects, track budgets, record deposits or withdrawals, monitor progress, and move finished projects to Complete Project.',
    icon: FolderKanban,
  },
  {
    title: '4. Financial Reports',
    text: 'Add WhatsApp-style reports or manual finance entries. Koryaal validates calculations before saving transactions to the database.',
    icon: ClipboardList,
  },
  {
    title: '5. Receipts and Export',
    text: 'Upload one or more invoice images, PDFs, or payment screenshots, then review monthly reports and export Excel summaries.',
    icon: FileSpreadsheet,
  },
]

const roleCards = [
  {
    role: 'Admin / Owner',
    text: 'Controls the full company workspace, users, roles, projects, reports, approvals, dashboard, and financial exports.',
  },
  {
    role: 'Engineer / Site Reporter',
    text: 'Works only on assigned projects, submits site reports, and views permitted report information.',
  },
  {
    role: 'Finance / Accountant',
    text: 'Reviews transactions, payment methods, categories, project cashflow, invoices, budgets, and monthly Excel reports.',
  },
  {
    role: 'Client',
    text: 'Views client-facing project progress and summaries only. Clients cannot add, edit, delete, or complete projects.',
  },
]

const quickActions = [
  { label: 'View Projects', link: '/projects', icon: FolderKanban },
  { label: 'Add Project', link: '/projects/add', icon: CheckCircle2 },
  { label: 'WhatsApp Report', link: '/add-report', icon: ClipboardList },
  { label: 'Manual Entry', link: '/manual-report', icon: Wallet },
  { label: 'Invoices', link: '/invoices', icon: Paperclip },
  { label: 'Users', link: '/users', icon: UserCog },
]

const rules = [
  'Only one submenu item is highlighted at a time so the current page is easy to identify.',
  'Completed projects are protected from new financial reports and accidental changes.',
  'Wrong arithmetic such as 5 x 10 = 20 is rejected before saving financial records.',
  'Receipt and invoice files are saved with reports so they can be opened again later.',
  'Forgot password sends a 6-digit code to the user email when SMTP is configured correctly.',
]

export default function HowToUse() {
  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
              <BookOpenCheck size={14} />
              Support Guideline
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              How Koryaal Works
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">
              Koryaal is a company-based construction management system for projects, users, reports, transactions, invoices, and Excel reporting. Use this guide when training admins, engineers, finance teams, and clients.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-100">Best daily flow</p>
            <ol className="mt-4 space-y-3 text-sm font-bold text-slate-200">
              <li>1. Add or select a project.</li>
              <li>2. Assign users and permissions.</li>
              <li>3. Record reports or cashflow.</li>
              <li>4. Attach invoices or screenshots.</li>
              <li>5. Review reports and export Excel.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {workflowSteps.map((step) => {
          const Icon = step.icon

          return (
            <div key={step.title} className="card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Icon size={21} />
              </div>
              <h3 className="mt-5 text-base font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">{step.text}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <UserCog size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950">Roles and Access</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Roles give a starting permission set. The admin can then fine-tune access using the checklist on the user form.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {roleCards.map((item) => (
              <div key={item.role} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-black text-slate-950">{item.role}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950">Financial Workflow</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Finance can record expenses, deposits, withdrawals, payment methods, invoices, and monthly reports.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <GuideRow title="WhatsApp Report" text="Paste engineer messages and preview extracted transactions before saving." />
            <GuideRow title="Manual Entry" text="Finance can enter transactions directly when there is no WhatsApp report." />
            <GuideRow title="Deposit / Withdraw" text="Record project income or withdrawals so cash balance and spending stay accurate." />
            <GuideRow title="Invoices" text="Open saved receipts, invoice PDFs, images, and payment screenshots anytime." />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="card p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <AlertTriangle size={21} />
            </div>
            <h3 className="text-2xl font-black text-slate-950">System Rules</h3>
          </div>

          <div className="mt-5 space-y-3">
            {rules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-cyan-700" />
                <p className="text-sm font-bold leading-6 text-slate-600">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg shadow-cyan-700/15">
            <LockKeyhole size={22} />
          </div>
          <h3 className="mt-5 text-2xl font-black text-slate-950">Login and Security</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
            Users log in with their registered email and password. If they forget the password, the reset code is sent to the email entered on the forgot-password form. The code expires after 10 minutes and can be used once.
          </p>
          <p className="mt-4 rounded-2xl bg-white p-4 text-xs font-bold leading-6 text-slate-500 ring-1 ring-cyan-100">
            Email delivery requires one system sender email configured in Laravel SMTP. The sender sends the code, but the code is delivered to the user email.
          </p>
        </div>
      </section>

      <section className="card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              <HelpCircle size={14} />
              Quick Navigation
            </div>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Open the page you need</h3>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-500">
            The sidebar groups Projects, Financials, and Users into submenus. Open one menu, choose the exact page, and only that selected page will be highlighted.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.label} to={action.link} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-cyan-100 hover:bg-cyan-50/60">
                <span className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <Icon size={18} className="text-cyan-700" />
                  {action.label}
                </span>
                <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-700" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function GuideRow({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  )
}
