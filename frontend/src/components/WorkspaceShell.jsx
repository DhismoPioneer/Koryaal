import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Building2, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Search, Command, X, Menu, Plus, ArrowUpRight, HelpCircle, LogOut, LayoutDashboard, FolderKanban, ClipboardList, MessageSquare } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './workspace.css'

gsap.registerPlugin(ScrollTrigger)

function Navigation({ items, openMenus, onToggle, collapsed, onNavigate, prefix }) {
  const { pathname } = useLocation()
  return <nav className="ws-navigation" aria-label={`${prefix} workspace navigation`}>
    <p className="ws-nav-label">WORKSPACE</p>
    {items.map(item => {
      const Icon = item.icon
      if (!item.children) return <NavLink key={item.to} to={item.to} end onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => `ws-nav-item ${isActive ? 'active' : ''}`}><Icon size={19} /><span>{item.label}</span></NavLink>
      const active = item.children.some(child => child.to === pathname)
      const expanded = Boolean(openMenus[item.key])
      return <div className="ws-nav-group" key={item.key}>
        <button className={`ws-nav-item ${active ? 'active-group' : ''}`} title={collapsed ? item.label : undefined} onClick={() => onToggle(item.key)} aria-label={item.label} aria-expanded={expanded} aria-controls={`${prefix}-${item.key}`}><Icon size={19} /><span>{item.label}</span><ChevronDown size={14} className={`ws-chevron ${expanded ? 'expanded' : ''}`} /></button>
        {expanded && !collapsed && <div className="ws-subnav" id={`${prefix}-${item.key}`}>{item.children.map(child => { const ChildIcon = child.icon; return <NavLink key={child.to} to={child.to} end onClick={onNavigate} className={({ isActive }) => `ws-subnav-item ${isActive ? 'active' : ''}`}><ChildIcon size={15} /><span>{child.label}</span></NavLink> })}</div>}
      </div>
    })}
  </nav>
}

export default function WorkspaceShell({ authUser, nav, openMenus, setOpenMenus, onLogout, canSubmitReports, canViewDashboard, canViewFinancials, children }) {
  const { pathname } = useLocation()
  const content = useRef(null)
  const searchDialog = useRef(null)
  const mobileDialog = useRef(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('koryaal_sidebar_collapsed') === 'true')
  const [query, setQuery] = useState('')
  const destinations = nav.flatMap(item => item.children ? item.children.map(child => ({ ...child, group: item.label })) : [{ ...item, group: 'Workspace' }]).concat([{ to: '/how-to-use', label: 'Field guide & help', icon: HelpCircle, group: 'Support' }])
  const current = destinations.find(item => item.to === pathname)
  const role = authUser?.role || 'client'

  useEffect(() => {
    const keydown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setQuery(''); if (!searchDialog.current.open) searchDialog.current.showModal() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [])

  useEffect(() => {
    searchDialog.current?.close()
    mobileDialog.current?.close()
    window.scrollTo({ top: 0, behavior: 'instant' })
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const seen = new WeakSet()
      const tweens = []
      const triggers = []
      const animate = () => {
        content.current?.querySelectorAll('.page-hero, .dashboard-hero, .card, .ws-project-card, .ws-quick-action').forEach(element => {
          if (seen.has(element)) return
          seen.add(element)
          triggers.push(ScrollTrigger.create({ trigger: element, start: 'top 97%', once: true, onEnter: () => {
            tweens.push(gsap.fromTo(element, { y: 18 }, { y: 0, duration: .65, ease: 'power3.out', clearProps: 'transform' }))
            if (element.matches('.dashboard-hero, .page-hero')) {
              const text = element.querySelectorAll('h2, .ws-eyebrow, .dashboard-hero-copy>p, .dashboard-hero-links')
              if (text.length) tweens.push(gsap.fromTo(text, { y: 12 }, { y: 0, stagger: .08, duration: .75, ease: 'power3.out', clearProps: 'transform' }))
            }
          } }))
        })
        ScrollTrigger.refresh()
      }
      animate()
      let frame
      const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(animate) })
      observer.observe(content.current, { childList: true, subtree: true })
      return () => { cancelAnimationFrame(frame); observer.disconnect(); triggers.forEach(trigger => trigger.kill()); tweens.forEach(tween => tween.revert()) }
    })
    return () => media.revert()
  }, [pathname])

  const toggle = key => { if (collapsed) { setCollapsed(false); localStorage.setItem('koryaal_sidebar_collapsed', 'false'); setOpenMenus(previous => ({ ...previous, [key]: true })); return }; setOpenMenus(previous => ({ ...previous, [key]: !previous[key] })) }
  const changeCollapsed = () => { setCollapsed(value => { localStorage.setItem('koryaal_sidebar_collapsed', String(!value)); return !value }) }
  const closeMobile = () => mobileDialog.current.close()
  const sidebar = (mobile = false) => <>
    <div className="ws-brand-row"><Link to="/" className="ws-brand" onClick={mobile ? closeMobile : undefined} aria-label="Koryaal overview"><span><Building2 size={23} /></span><strong>Koryaal<span>.</span></strong></Link>{mobile && <button className="ws-icon-button" aria-label="Close navigation" onClick={closeMobile}><X size={20} /></button>}</div>
    <div className="ws-company"><span className="ws-company-avatar">{(authUser?.company?.name || 'K').charAt(0).toUpperCase()}</span><div><strong>{authUser?.company?.name || 'Your workspace'}</strong><span><i /> Company workspace</span></div></div>
    <Navigation items={nav} openMenus={openMenus} onToggle={toggle} collapsed={!mobile && collapsed} onNavigate={mobile ? closeMobile : undefined} prefix={mobile ? 'mobile' : 'desktop'} />
    <div className="ws-sidebar-guide"><div className="ws-guide-symbol"><HelpCircle size={19} /></div><strong>A little guidance?</strong><p>Everything you need to get your team moving.</p><Link to="/how-to-use" onClick={mobile ? closeMobile : undefined}>Explore the field guide <ArrowUpRight size={15} /></Link></div>
    <div className="ws-sidebar-footer"><Link className="ws-nav-item" to="/settings" onClick={mobile ? closeMobile : undefined}><span className="ws-avatar">{authUser?.name?.charAt(0).toUpperCase() || 'U'}</span><span><strong>{authUser?.name || 'Your account'}</strong><small>{role}</small></span></Link><button className="ws-logout" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div>
  </>

  return <div className={`workspace-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <a href="#workspace-main" className="ws-skip-link">Skip to workspace content</a>
    <aside className="ws-sidebar">{sidebar()}<button className="ws-collapse" onClick={changeCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}</button></aside>
    <div className="ws-body">
      <header className="ws-topbar"><div className="ws-breadcrumb"><button className="ws-icon-button ws-mobile-menu" aria-label="Open navigation" onClick={() => mobileDialog.current.showModal()}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>{current?.label || (pathname === '/' ? 'Overview' : 'Workspace')}</strong></div><div className="ws-topbar-actions"><button className="ws-search-button" onClick={() => { setQuery(''); searchDialog.current.showModal() }}><Search size={16} /><span>Find a page...</span><kbd>Ctrl K</kbd></button>{canSubmitReports && <Link to="/add-report" className="ws-add-button"><Plus size={16} /><span>New report</span></Link>}<Link className="ws-top-avatar ws-avatar" to="/settings" aria-label="Account settings">{authUser?.name?.charAt(0).toUpperCase() || 'U'}</Link></div></header>
      <main id="workspace-main" className="ws-main" ref={content}>{children}</main>
      <footer className="ws-page-footer"><span><Building2 size={13} /> Koryaal · A clearer way to build.</span><Link to="/how-to-use">Need a hand? <ArrowUpRight size={13} /></Link></footer>
    </div>
    <nav className="ws-bottom-nav" aria-label="Mobile quick navigation">{canViewDashboard && <NavLink to="/" end><LayoutDashboard size={20} /><span>Overview</span></NavLink>}<NavLink to="/projects"><FolderKanban size={20} /><span>Projects</span></NavLink>{canSubmitReports && <NavLink to="/add-report"><MessageSquare size={20} /><span>New report</span></NavLink>}{canViewFinancials && <NavLink to="/reports"><ClipboardList size={20} /><span>Reports</span></NavLink>}<button onClick={() => mobileDialog.current.showModal()}><Menu size={20} /><span>More</span></button></nav>
    <dialog className="ws-search-dialog" ref={searchDialog} aria-label="Find a workspace page" onClick={event => { if (event.target === event.currentTarget) searchDialog.current.close() }}><div className="ws-search-input"><Search size={20} /><input autoFocus placeholder="Where would you like to go?" aria-label="Search workspace pages" value={query} onChange={event => setQuery(event.target.value)} /><button className="ws-icon-button" aria-label="Close search" onClick={() => searchDialog.current.close()}><X size={18} /></button></div><p className="ws-dialog-label">{query ? 'MATCHING PAGES' : 'GO SOMEWHERE'}</p><div className="ws-search-results">{destinations.filter(item => `${item.label} ${item.group}`.toLowerCase().includes(query.toLowerCase())).map(item => { const Icon = item.icon; return <Link to={item.to} key={item.to} onClick={() => searchDialog.current.close()}><Icon size={19} /><span><strong>{item.label}</strong><small>{item.group}</small></span><ArrowUpRight size={16} /></Link> })}{!destinations.some(item => `${item.label} ${item.group}`.toLowerCase().includes(query.toLowerCase())) && <p className="ws-search-empty">No matching pages. Try “projects” or “settings”.</p>}</div><div className="ws-search-hint"><Command size={13} /> Use Tab to explore · Enter to open · Esc to close</div></dialog>
    <dialog className="ws-mobile-drawer" ref={mobileDialog} aria-label="Workspace navigation" onClick={event => { if (event.target === event.currentTarget) closeMobile() }}>{sidebar(true)}</dialog>
  </div>
}
