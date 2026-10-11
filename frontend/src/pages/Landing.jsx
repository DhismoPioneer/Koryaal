import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, ArrowDown, Building2, Menu, X, MessageSquare, Wallet, FolderKanban, ShieldCheck, Check, Layers, MoveUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

const projects = [
  { name: 'The courtyard residence', type: 'Residential', location: 'Mogadishu', color: 'sand', description: 'A residential example showing how site updates, material costs, and approvals come together in one workspace.', floors: 3 },
  { name: 'A new place to work', type: 'Commercial', location: 'Hargeisa', color: 'blue', description: 'A commercial example with a shared view of contractor expenses, invoices, and project budgets.', floors: 5 },
  { name: 'Built for the everyday', type: 'Residential', location: 'Garowe', color: 'sage', description: 'A housing example that keeps engineers and clients connected from the first report to handover.', floors: 2 },
]

function Architecture({ floors = 4 }) {
  return <div className="architecture" aria-hidden="true"><div className="model-ground" /><div className="model-building"><div className="building-roof" /><div className="building-front">{Array.from({ length: floors }, (_, i) => <div className="building-floor" key={i}>{Array.from({ length: 5 }, (_, j) => <span key={j} />)}</div>)}</div><div className="building-side">{Array.from({ length: floors }, (_, i) => <div key={i}><span /><span /></div>)}</div></div><div className="model-tree tree-one" /><div className="model-tree tree-two" /><div className="model-path" /></div>
}

export default function Landing() {
  const root = useRef(null)
  const model = useRef(null)
  const dialog = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('All projects')
  const [selected, setSelected] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('[data-hero]', { y: 35, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', clearProps: 'all' })
        gsap.from('.hero-scene', { opacity: 0, scale: .93, duration: 1.3, ease: 'power2.out', clearProps: 'all' })
        gsap.to('.hero-scene .architecture', { y: -14, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.utils.toArray('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 45, opacity: 0, duration: .8, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 90%', once: true } })
        })
        gsap.to('.scene-orbit', { rotation: 65, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
        gsap.to('.reading-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } })
      }, root)
      return () => context.revert()
    })
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id) })
    }, { rootMargin: '-20% 0px -55% 0px' })
    root.current.querySelectorAll('section[id]').forEach(section => observer.observe(section))
    return () => { media.revert(); observer.disconnect() }
  }, [])

  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal()
    if (!selected && dialog.current.open) dialog.current.close()
    if (!selected) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [selected])

  useEffect(() => { ScrollTrigger.refresh() }, [filter])

  useEffect(() => {
    if (!menuOpen) return
    const onEscape = event => { if (event.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [menuOpen])

  const moveModel = event => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - .5
    const y = (event.clientY - bounds.top) / bounds.height - .5
    gsap.to(model.current, { rotateY: x * 14, rotateX: -y * 10, duration: .6, ease: 'power2.out' })
  }

  return <div className="koryaal-landing" ref={root}>
    <a href="#main-content" className="landing-skip">Skip to content</a>
    <div className="reading-progress" aria-hidden="true" />
    <header className="landing-header">
      <Link to="/" className="landing-brand" aria-label="Koryaal home"><span className="brand-symbol"><Building2 size={23} /></span>Koryaal<span className="brand-dot">.</span></Link>
      <nav id="landing-navigation" className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        {[['overview', 'Overview'], ['services', 'What we do'], ['portfolio', 'Project showcase'], ['approach', 'Our approach']].map(([id, label]) => <a href={`#${id}`} key={id} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
      </nav>
      <Link className="nav-login" to="/login">Your workspace <ArrowUpRight size={17} /></Link>
      <button className="landing-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="landing-navigation">{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <main id="main-content">
      <section className="hero landing-container" id="overview">
        <div className="hero-copy">
          <p className="eyebrow" data-hero><span className="live-dot" /> MADE FOR THE PEOPLE WHO BUILD</p>
          <h1 data-hero>Big ambitions.<br />Solid foundations.<br /><span>Less busywork.</span></h1>
          <p className="hero-description" data-hero>From the first site report to the final handover. Bring your projects, people, and finances together — and get back to building.</p>
          <div className="hero-actions" data-hero><Link to="/login" className="landing-button">Build with Koryaal <ArrowUpRight size={19} /></Link><a href="#services" className="text-link">Explore the possibilities <ArrowDown size={16} /></a></div>
          <div className="hero-footnote" data-hero><span className="tiny-avatars"><span>EN</span><span>FN</span><span>PM</span></span><p>For the field. For the office.<br /><strong>For everyone on your team.</strong></p></div>
        </div>
        <div className="hero-scene" onPointerMove={moveModel} onPointerLeave={() => gsap.to(model.current, { rotateX: 0, rotateY: 0, duration: .7 })}>
          <div className="scene-grid" /><div className="scene-orbit" /><div className="scene-label"><span>THE BIG PICTURE</span><span>01 / KORYAAL</span></div>
          <div className="model-wrapper" ref={model}><Architecture /></div>
          <div className="scene-report"><span className="scene-icon"><MessageSquare size={18} /></span><div><strong>Site update received</strong><span>From the field to your workspace</span></div><span className="report-check"><Check size={15} /></span></div>
          <div className="scene-budget"><span><Wallet size={14} /> BUDGET VISIBILITY</span><strong>Every detail.<br />Accounted for.</strong><div className="budget-bars">{[38, 58, 46, 72, 62, 88, 78].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
          <span className="scene-coordinate">2.0469° N · 45.3182° E</span><span className="scene-hint"><Layers size={14} /> Move your cursor to explore</span>
        </div>
      </section>

      <div className="capability-strip"><span>A little less friction. A lot more clarity.</span><div><Building2 size={18} /> Project management</div><div><MessageSquare size={18} /> Field reporting</div><div><Wallet size={18} /> Financial control</div><div><ShieldCheck size={18} /> Team access</div></div>

      <section id="services" className="landing-container landing-section">
        <div className="section-heading" data-reveal><div><p className="eyebrow">01 / ONE CONNECTED WORKSPACE</p><h2>All the moving parts.<br /><span>Finally, in one place.</span></h2></div><p>Good work needs room to happen.<br />We take care of the admin around it.</p></div>
        <div className="service-bento">
          <article className="bento-card report-card" data-reveal><MessageSquare className="bento-icon" /><div><p className="small-label">FROM MESSAGE TO MEANING</p><h3>Site reports.<br />Without the paper chase.</h3><p>Turn engineer WhatsApp updates into structured reports. Review the details, check totals, and keep work moving.</p></div><div className="message-demo"><span>FIELD UPDATE <span>09:41</span></span><p>5 fuundi x15.5 = 77.5<br />3 shaqaale x7.5 = 22.5<br />matoor = 35</p><div><Check size={15} /> Ready to review <strong>$135.00</strong></div></div><Link to="/login" className="bento-link">Bring your reports together <ArrowUpRight size={18} /></Link></article>
          <article className="bento-card finance-card" data-reveal><Wallet className="bento-icon" /><h3>Know where<br />every dollar goes.</h3><p>Budgets, deposits, expenses, and invoice records. One clear financial picture.</p><div className="finance-graphic" aria-hidden="true"><span>BUDGET</span><div><i /><i /><i /><i /><i /><i /><i /><i /></div><span>PLAN WITH CONFIDENCE <MoveUpRight size={15} /></span></div><Link to="/login" className="bento-link">See the bigger picture <ArrowUpRight size={18} /></Link></article>
          <article className="bento-card project-card" data-reveal><FolderKanban className="bento-icon" /><h3>A home for<br />every project.</h3><p>Keep progress, people, and project records connected from day one.</p><div className="project-demo"><span><i /> Foundation works <Check size={14} /></span><span><i /> Structure & framing <span>IN PROGRESS</span></span><span><i /> Finishing touches <span>UP NEXT</span></span></div></article>
          <article className="bento-card team-card" data-reveal><ShieldCheck className="bento-icon" /><div><h3>The right people.<br />The right access.</h3><p>Purposeful workspaces for admins, engineers, finance teams, and clients.</p></div><div className="team-pills"><span>Engineer</span><span>Finance</span><span>Client</span><span>Admin</span></div></article>
        </div>
      </section>

      <section id="portfolio" className="landing-container landing-section portfolio-section">
        <div className="section-heading" data-reveal><div><p className="eyebrow">02 / POSSIBILITIES, BUILT</p><h2>Different projects.<br /><span>The same clear picture.</span></h2></div><p>A few illustrative project scenarios.<br />Imagine what your team could build.</p></div>
        <div className="portfolio-toolbar"><div className="portfolio-filters" aria-label="Filter project showcase">{['All projects', 'Residential', 'Commercial'].map(item => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)} className={filter === item ? 'selected' : ''}>{item}</button>)}</div><span>CONCEPT SHOWCASE / {String(projects.filter(p => filter === 'All projects' || p.type === filter).length).padStart(2, '0')}</span></div>
        <div className="portfolio-grid">{projects.filter(p => filter === 'All projects' || p.type === filter).map((project, index) => <button key={project.name} className="portfolio-item" onClick={() => setSelected(project)} aria-label={`Explore ${project.name}`}><div className={`portfolio-art ${project.color}`}><span className="project-number">0{index + 1} / CONCEPT</span><Architecture floors={project.floors} /><span className="portfolio-open"><ArrowUpRight size={23} /></span></div><div className="portfolio-caption"><h3>{project.name}</h3><span>{project.type} <span>·</span> {project.location}</span></div></button>)}</div>
      </section>

      <section id="approach" className="approach-section"><div className="landing-container approach-inner"><div data-reveal><p className="eyebrow">03 / LESS FRICTION, MORE FORWARD</p><h2>Built around<br /><span>your real work.</span></h2><p>No two sites are the same. Your tools should help your team stay connected, wherever the work takes you.</p><Link className="text-link" to="/login">Find your workspace <ArrowUpRight size={18} /></Link></div><div className="approach-steps">{[['01', 'Capture it in the field.', 'Bring site messages and supporting invoices into your project.'], ['02', 'Make sense of the details.', 'Review parsed entries, check totals, and approve reports.'], ['03', 'Move forward together.', 'Give your team a shared view of progress and project finances.']].map(([number, title, text]) => <article key={number} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={22} /></article>)}</div></div></section>

      <section className="landing-container closing-section" data-reveal><p className="eyebrow"><span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE</p><h2>Make room for<br /><span>better building.</span></h2><Link to="/login" className="landing-button">Let’s get to work <ArrowUpRight size={20} /></Link><div className="closing-drawing" aria-hidden="true"><Building2 /></div></section>
    </main>
    <footer className="landing-footer landing-container"><Link to="/" className="landing-brand"><Building2 size={24} /> Koryaal.</Link><p>Thoughtfully connected. Solidly built.</p><a href="#overview">Back to top <ArrowUpRight size={16} /></a><span>© {new Date().getFullYear()} Koryaal</span></footer>
    <dialog ref={dialog} className="project-dialog" aria-label={selected ? `${selected.name} project details` : 'Project details'} onCancel={() => setSelected(null)} onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null) }}>
      {selected && <><button className="dialog-close" onClick={() => setSelected(null)} aria-label="Close project details" autoFocus><X size={20} /></button><div className={`portfolio-art ${selected.color}`}><Architecture floors={selected.floors} /></div><div className="dialog-copy"><p className="eyebrow">ILLUSTRATIVE PROJECT / {selected.type.toUpperCase()}</p><h2>{selected.name}</h2><p>{selected.description}</p><Link to="/login" className="landing-button">Manage your own projects <ArrowRight size={18} /></Link></div></>}
    </dialog>
  </div>
}
