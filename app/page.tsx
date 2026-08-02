'use client'

import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  stagger,
  useAnimate,
} from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import React from 'react'

// ─── Utility: fade-slide-up variant factory ───────────────────────────────────
const fadeUp = (delay = 0, distance = 32) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay },
  },
})

const staggerContainer = (staggerVal = 0.1, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerVal, delayChildren },
  },
})

const fadeInLeft = (delay = 0, distance = 40) => ({
  hidden: { opacity: 0, x: -distance },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay },
  },
})

// ─── Animated Counter ────────────────────────────────────────────────────────
// Deliberately timer-based (setInterval + elapsed-time math), not Framer's
// useSpring/RAF — a prior version relied on requestAnimationFrame and got
// visibly stuck at 0 (the original bug report). Timers keep running even
// where RAF is throttled or suspended, and a final setDisplay(target) after
// the duration guarantees the correct value lands regardless.
function AnimatedCounter({
  target,
  suffix = '',
  duration = 2,
  decimals = 0,
}: {
  target: number
  suffix?: string
  duration?: number
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const durationMs = duration * 1000
    const id = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(1, elapsed / durationMs)
      // ease-out cubic, matches the feel of the previous spring
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Number((eased * target).toFixed(decimals)))
      if (progress >= 1) {
        setDisplay(Number(target.toFixed(decimals)))
        clearInterval(id)
      }
    }, 30)
    return () => clearInterval(id)
  }, [inView, target, duration, decimals])

  // Hard fallback: if IntersectionObserver never fires for any reason (the
  // exact silent failure mode that caused the original bug), the real number
  // still lands a few seconds after mount instead of being stuck at 0 forever.
  useEffect(() => {
    const fallback = setTimeout(() => setDisplay((d) => (d === 0 ? target : d)), 4000)
    return () => clearTimeout(fallback)
  }, [target])

  return (
    <span ref={ref}>
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

// ─── Hero centerpiece: the anchor drops and settles, with calm ripples ──────
// Reuses the app's own "drop anchor" check-in motif (a ringed anchor icon) so
// the marketing site and the product read as the same brand on first glance —
// and the motion itself illustrates the headline: something settles, calms.
function AnchorMark() {
  return (
    <div className="relative flex items-center justify-center mb-2" style={{ width: 140, height: 140 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width: 64, height: 64, border: '1px solid var(--color-accent)' }}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.35, 0], scale: [1, 2.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.9 + i * 0.9, ease: 'easeOut' }}
        />
      ))}
      <motion.svg
        width="46"
        height="46"
        viewBox="0 0 96 96"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ y: -60, opacity: 0, rotate: -10 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <circle cx="48" cy="28" r="10" />
        <line x1="48" y1="38" x2="48" y2="72" />
        <line x1="28" y1="52" x2="68" y2="52" />
        <path d="M28 72 C28 80 37 84 48 84 C59 84 68 80 68 72" />
      </motion.svg>
    </div>
  )
}

// ─── Word-by-word hero headline ───────────────────────────────────────────────
// Takes explicit lines rather than one string + organic wrapping — guarantees
// the break always falls exactly where intended, regardless of viewport width.
function AnimatedHeadline({ lines, center = false, startDelay = 0.3 }: { lines: string[]; center?: boolean; startDelay?: number }) {
  return (
    <motion.h1
      className={`font-lora text-[44px] md:text-6xl lg:text-[76px] font-bold leading-[1.12] text-heading ${center ? 'text-center' : ''}`}
      variants={staggerContainer(0.08, startDelay)}
      initial="hidden"
      animate="visible"
    >
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word, wi, arr) => (
            <React.Fragment key={wi}>
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 48, filter: 'blur(6px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                  },
                }}
              >
                {word}
              </motion.span>
              {/* Real sibling space character (not trailing-inside-inline-block,
                  which browsers collapse) — keeps innerText/screen readers/
                  copy-paste from reading words as one run-on string. */}
              {wi < arr.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </span>
      ))}
    </motion.h1>
  )
}

// ─── Animated sine waves (hero + final CTA background) ──────────────────────
// Builds one repeating wave "period" as a smooth cubic-bezier path, then tiles
// it `copies` times. Animating x from 0 to exactly -(one period's width) loops
// seamlessly, since the tile after the shift is pixel-identical to the start.
function wavePath(period: number, amplitude: number, copies: number, baseline: number): string {
  let d = `M0,${baseline}`
  for (let i = 0; i < copies; i++) {
    const x0 = i * period
    d += ` C${x0 + period * 0.25},${baseline - amplitude} ${x0 + period * 0.25},${baseline + amplitude} ${x0 + period * 0.5},${baseline}`
    d += ` C${x0 + period * 0.75},${baseline - amplitude} ${x0 + period * 0.75},${baseline + amplitude} ${x0 + period},${baseline}`
  }
  return d
}

function SineWaves() {
  const waves = [
    { period: 600, amplitude: 26, duration: 18, opacity: 0.12, top: '58%' },
    { period: 500, amplitude: 34, duration: 25, opacity: 0.1, top: '70%' },
    { period: 700, amplitude: 20, duration: 32, opacity: 0.08, top: '82%' },
  ]
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden" style={{ height: '42%' }}>
      {waves.map((w, i) => {
        const copies = 4 // tiled twice-over (2 full periods repeated twice = seamless -50% loop)
        const width = w.period * copies
        return (
          <motion.svg
            key={i}
            className="absolute left-0"
            style={{ top: w.top, width: width * 2 }}
            viewBox={`0 0 ${width * 2} 120`}
            preserveAspectRatio="none"
            height="120"
            animate={{ x: [0, -width] }}
            transition={{ duration: w.duration, repeat: Infinity, ease: 'linear' }}
          >
            <path
              d={wavePath(w.period, w.amplitude, copies * 2, 60)}
              stroke="#4ecdc4"
              strokeWidth="2"
              fill="none"
              opacity={w.opacity}
            />
          </motion.svg>
        )
      })}
    </div>
  )
}

// ─── Section wrapper with InView ─────────────────────────────────────────────
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer(0.12, 0.05)}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Waitlist Form ─────────────────────────────────────────────────────────────
function WaitlistForm({ large = false, source = 'hero' }: { large?: boolean; source?: 'hero' | 'footer' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (!data.ok) { setStatus('error'); return }
      setStatus(data.duplicate ? 'duplicate' : 'success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success' || status === 'duplicate') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" fill="#4ecdc4" />
          <path d="M5.5 9l2.5 2.5 5-5" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-teal text-sm font-medium">
          {status === 'duplicate' ? "You're already on the list." : "You're on the list. We'll email you the day we launch."}
        </span>
      </motion.div>
    )
  }

  return (
    <div>
    {status === 'error' && (
      <p className="text-sm mb-3" style={{ color: '#f2a65a' }}>
        Something went wrong. Try <a href="mailto:hello@getanchorhealth.app" className="underline">hello@getanchorhealth.app</a> directly.
      </p>
    )}
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 w-full ${large ? 'max-w-md' : 'max-w-sm'}`}>
      <input
        type="email"
        placeholder="Your email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-full px-5 py-3 text-sm text-heading outline-none placeholder-muted"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.14)',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(78,205,196,0.5)'
          e.target.style.boxShadow = '0 0 0 3px rgba(78,205,196,0.08)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.14)'
          e.target.style.boxShadow = 'none'
        }}
      />
      <motion.button
        type="submit"
        disabled={status === 'loading'}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className={`rounded-full font-semibold whitespace-nowrap transition-all ${large ? 'px-7 py-3.5 text-base' : 'px-6 py-3 text-sm'}`}
        style={{
          background: '#4ecdc4',
          color: '#0a1628',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Joining…' : 'Notify me'}
      </motion.button>
    </form>
    </div>
  )
}

// ─── Coming Soon Badge ─────────────────────────────────────────────────────────
function ComingSoonBadge({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full font-medium ${
        large ? 'px-8 py-4 text-base gap-4' : 'px-6 py-3 text-sm'
      }`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: '#9ec8dc',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 814 1000"
        width={large ? 22 : 18}
        height={large ? 22 : 18}
        fill="#9ec8dc"
      >
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.5-57.8-155.5-127.4C46 790.8 0 665.4 0 552.9 0 349.2 120.1 241.3 238.4 241.3c66.5 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
      </svg>
      <span>
        <span className="block text-[10px] opacity-75 font-normal leading-none mb-0.5">Coming to the</span>
        <span className={`font-semibold leading-none ${large ? 'text-lg' : 'text-base'}`}>App Store</span>
      </span>
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureRow({
  title,
  description,
  isPlus = false,
}: {
  title: string
  description: string
  isPlus?: boolean
}) {
  return (
    <motion.div variants={fadeUp(0, 16)} className="flex items-start gap-3">
      <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill="rgba(78,205,196,0.12)" />
        <path d="M5.5 9.2l2.2 2.2L12.8 6" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <p className="flex items-center gap-2">
          <span className="text-heading text-[15px]" style={{ fontWeight: 500 }}>{title}</span>
          {isPlus && (
            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(78,205,196,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(78,205,196,0.3)' }}>
              Plus
            </span>
          )}
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)', fontWeight: 300 }}>{description}</p>
      </div>
    </motion.div>
  )
}

// ─── Pain Point Card ──────────────────────────────────────────────────────────
function PainCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      variants={fadeInLeft(0)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="p-7"
      style={{
        background: 'var(--color-surface)',
        borderLeft: '3px solid var(--color-accent)',
        borderRadius: '0 12px 12px 0',
      }}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="font-lora text-xl font-semibold text-heading mb-3">{title}</h3>
      <p className="text-body leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({
  tier,
  price,
  annualPrice,
  description,
  features,
  cta,
  highlighted = false,
  comingSoon = false,
  isAnnual,
}: {
  tier: string
  price: string
  annualPrice?: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  comingSoon?: boolean
  isAnnual: boolean
}) {
  const displayPrice = isAnnual && annualPrice ? annualPrice : price

  return (
    <motion.div
      variants={fadeUp(0, 24)}
      className={highlighted ? 'md:-translate-y-4' : undefined}
    >
    <motion.div
      whileHover={{ y: highlighted ? -10 : -6, scale: highlighted ? 1.02 : 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative rounded-2xl p-8 flex flex-col"
      style={{
        background: highlighted ? 'linear-gradient(135deg, #0f2540 0%, var(--color-surface) 100%)' : 'var(--color-surface)',
        border: highlighted ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: highlighted
          ? '0 0 40px rgba(78,205,196,0.12), 0 16px 48px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {highlighted && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
          style={{ background: '#4ecdc4', color: '#0a1628' }}
        >
          Most Popular
        </div>
      )}
      {comingSoon && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
          style={{ background: '#1a3050', color: '#5a8ea8', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Coming Soon
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-lora text-2xl font-bold text-heading mb-2">{tier}</h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>

      <div className="mb-6">
        <motion.div
          key={displayPrice}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-end gap-1"
        >
          <span className="font-lora text-4xl font-bold text-heading">{displayPrice}</span>
          {displayPrice !== 'Free' && displayPrice !== 'Custom' && (
            <span className="text-muted text-sm mb-1.5">/{isAnnual ? 'mo' : 'mo'}</span>
          )}
        </motion.div>
        {isAnnual && annualPrice && price !== 'Free' && price !== 'Custom' && (
          <p className="text-teal text-xs mt-1">Billed annually — save 49% · A$79.99/year</p>
        )}
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-body">
            <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="rgba(78,205,196,0.12)" />
              <path d="M5 8l2 2 4-4" stroke="#4ecdc4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* Real CTA — every tier scrolls to the waitlist form, no payment UI */}
      <a
        href="#waitlist"
        className="text-center rounded-xl py-3.5 text-sm font-semibold transition-colors"
        style={{
          background: highlighted ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
          color: highlighted ? 'var(--color-bg)' : 'var(--color-text)',
          border: highlighted ? 'none' : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {cta}
      </a>
    </motion.div>
    </motion.div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-heading text-[15px] font-medium group-hover:text-teal transition-colors">{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(78,205,196,0.1)', color: '#4ecdc4' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-body text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  const inputClass = 'w-full rounded-xl px-4 py-3.5 text-sm text-heading bg-transparent outline-none transition-all placeholder-muted'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }
  const inputFocusStyle = { border: '1px solid rgba(78,205,196,0.4)', boxShadow: '0 0 0 3px rgba(78,205,196,0.08)' }

  return (
    <motion.form onSubmit={handleSubmit} variants={fadeUp(0.1, 24)} className="flex flex-col gap-4">
      <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)}
        className={inputClass} style={inputStyle}
        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
        onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
      <input type="email" placeholder="Email address *" required value={email} onChange={(e) => setEmail(e.target.value)}
        className={inputClass} style={inputStyle}
        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
        onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
      <textarea placeholder="How can we help? *" required value={message} onChange={(e) => setMessage(e.target.value)}
        rows={5} className={`${inputClass} resize-none`} style={inputStyle}
        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
        onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.25)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" fill="#4ecdc4" />
              <path d="M5.5 9l2.5 2.5 5-5" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-teal text-sm font-medium">Message sent! We'll reply within 24 hours.</span>
          </motion.div>
        ) : (
          <motion.button key="btn" type="submit" disabled={status === 'loading'}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="rounded-xl py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ background: '#4ecdc4', color: '#0a1628', opacity: status === 'loading' ? 0.7 : 1 }}>
            {status === 'loading' ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border-2 border-[#0a1628] border-t-transparent" />
                Sending...
              </>
            ) : 'Send Message'}
          </motion.button>
        )}
      </AnimatePresence>
      {status === 'error' && <p className="text-red-400 text-sm">{errorMsg}</p>}
    </motion.form>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { scrollY } = useScroll()
  const [navScrolled, setNavScrolled] = useState(false)
  const [isAnnual, setIsAnnual] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  useEffect(() => {
    return scrollY.on('change', (v) => setNavScrolled(v > 40))
  }, [scrollY])

  const faqCategories: { category: string; icon: React.ReactNode; items: { q: string; a: string }[] }[] = [
    {
      category: 'Getting Started',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
      items: [
        { q: 'When will Anchor be on the App Store?', a: 'We\'re in the final stages before launch. Sign up above and we\'ll email you the moment it goes live — you\'ll be among the first to download it.' },
        { q: 'Is it available on Android?', a: 'Anchor is launching on iOS first. Android is on our roadmap and we\'ll announce it when it\'s ready.' },
        { q: 'How is Anchor different from therapy?', a: 'Anchor is a daily self-management tool for health anxiety, not a replacement for clinical care. It gives you evidence-based techniques to use between sessions, or on your own journey.' },
      ],
    },
    {
      category: 'Account & Billing',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
      items: [
        { q: 'How do I cancel my subscription?', a: 'Open the App Store → tap your profile picture → Subscriptions → find Anchor and tap Cancel Subscription. You\'ll keep Plus until the end of your current billing period.' },
        { q: 'Is my data backed up?', a: 'Yes. Everything syncs securely to your Anchor account so your history is always safe, even if you change devices.' },
      ],
    },
    {
      category: 'Technical',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      items: [
        { q: 'Notifications aren\'t working', a: 'Go to iPhone Settings → Notifications → Anchor and make sure notifications are enabled. Also check your Focus mode settings aren\'t blocking them.' },
        { q: 'The app won\'t load', a: 'Force-close the app and reopen it. If the issue persists, try deleting and reinstalling. Still broken? Contact us and we\'ll sort it out.' },
        { q: 'How do I reset my password?', a: 'On the sign-in screen, tap "Forgot password?" and enter your email. We\'ll send you a reset link within a minute.' },
      ],
    },
    {
      category: 'Privacy',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      items: [
        { q: 'Do you sell my data?', a: 'Never. Your data is yours, full stop. We are not in the business of selling personal information — especially health information.' },
        { q: 'Who can see my entries?', a: 'Only you. All journal entries and check-ins are private and encrypted. No one at Anchor can read your personal entries.' },
        { q: 'Can I delete my account?', a: 'Yes, at any time. Tap your profile icon in the top right of the app → Manage account → Delete account. This permanently removes all your data from our servers.' },
      ],
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      {/* ─── NAV ─────────────────────────────────────────────────────────── */}
      <motion.nav
        animate={navScrolled ? 'scrolled' : 'top'}
        variants={{
          top: { backgroundColor: 'rgba(10,22,40,0)', backdropFilter: 'blur(0px)', borderBottomColor: 'rgba(78,205,196,0)' },
          scrolled: { backgroundColor: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(20px)', borderBottomColor: 'rgba(78,205,196,0.1)' },
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ borderBottomColor: 'rgba(78,205,196,0)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <motion.a href="#" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Anchor" width={32} height={32} className="rounded-xl" style={{ display: 'block' }} />
            <span className="font-lora text-lg font-bold text-heading">Anchor</span>
          </motion.a>

          {/* Center links */}
          <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="hidden md:flex items-center gap-7">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Support', href: '#support' },
            ].map((link) => (
              <a key={link.href} href={link.href} className="text-body text-sm hover:text-heading transition-colors">{link.label}</a>
            ))}
          </motion.nav>

          {/* CTA — coming soon pill */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <a
              href="#waitlist"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ background: 'rgba(78,205,196,0.12)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              Join waitlist
            </a>
          </motion.div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center"
          >
            <span className="relative w-5 h-4 block">
              <span className="absolute left-0 right-0 h-[1.5px] transition-all duration-300" style={{ background: 'var(--color-text)', top: mobileMenuOpen ? '7px' : '0px', transform: mobileMenuOpen ? 'rotate(45deg)' : 'none' }} />
              <span className="absolute left-0 right-0 h-[1.5px] top-[7px] transition-opacity duration-200" style={{ background: 'var(--color-text)', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span className="absolute left-0 right-0 h-[1.5px] transition-all duration-300" style={{ background: 'var(--color-text)', top: mobileMenuOpen ? '7px' : '14px', transform: mobileMenuOpen ? 'rotate(-45deg)' : 'none' }} />
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen nav overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center gap-8"
            style={{ background: 'var(--color-bg)' }}
          >
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Support', href: '#support' },
            ].map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className="font-lora text-3xl text-heading"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#waitlist"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + 4 * 0.06 }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            >
              Join waitlist
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section id="waitlist" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Animated background glow */}
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 900, height: 700, background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.13) 0%, transparent 65%)' }}
        />
        <SineWaves />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(78,205,196,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.06) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-3xl mx-auto px-6 lg:px-8 w-full py-20 flex flex-col items-center text-center">
          {/* The anchor settles first — a brief, deliberate brand moment before the message arrives */}
          <AnchorMark />

          {/* Coming soon badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
            style={{ background: 'rgba(78,205,196,0.1)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            Coming to iPhone · Evidence-based CBT
          </motion.div>

          <AnimatedHeadline lines={["Your mind is racing.", "Let's slow it down."]} center startDelay={0.85} />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="text-body text-lg leading-relaxed mt-6 mb-8 max-w-lg mx-auto"
          >
            The calm, evidence-based companion for health anxiety. Track symptoms,
            challenge spirals, and build lasting resilience — right from your iPhone.
          </motion.p>

          {/* Waitlist CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.55 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <p className="text-muted text-sm font-medium">Get notified when we launch on the App Store:</p>
            <WaitlistForm />
            <div className="flex items-center gap-3">
              <ComingSoonBadge />
              <p className="text-muted text-xs">iOS · Free to download</p>
            </div>
          </motion.div>

          {/* Mini stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.75 }}
            className="flex items-center justify-center gap-10 mt-12 pt-10 border-t w-full"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            {[
              { text: '7 CBT techniques', label: 'built in' },
              { text: '100% private', label: 'your data, yours only' },
              { text: 'No ads. Ever.', label: 'no tracking either' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-heading text-xl font-bold font-lora">{s.text}</p>
                <p className="text-muted text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 rounded-full"
            style={{ background: 'linear-gradient(to bottom, rgba(78,205,196,0.5), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ─── SOCIAL PROOF BAR ────────────────────────────────────────────── */}
      <section className="py-14 border-y" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8">
            {[
              { value: 56.8, decimals: 1, suffix: '%', label: 'of people experience cyberchondria' },
              { value: 63, suffix: '%', label: 'of anxiety cases go untreated' },
              { text: 'CBT', label: 'evidence-based techniques built in' },
              { text: '24/7', label: 'calm perspective when you need it' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center text-center px-4 relative">
                {i > 0 && (
                  <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-10 w-px" style={{ background: 'var(--color-border)' }} />
                )}
                <p className="font-lora text-4xl md:text-[40px] font-bold" style={{ color: 'var(--color-accent)' }}>
                  {stat.text ? stat.text : <AnimatedCounter target={stat.value ?? 0} suffix={stat.suffix} decimals={stat.decimals ?? 0} />}
                </p>
                <p className="text-[12px] uppercase tracking-wide mt-2 max-w-[160px]" style={{ color: 'var(--color-muted)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PAIN POINTS ─────────────────────────────────────────────────── */}
      <Section className="py-28 max-w-7xl mx-auto px-6 lg:px-8" id="pain-points">
        <motion.div variants={fadeUp(0)} className="text-center mb-16">
          <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Sound familiar?</p>
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading max-w-2xl mx-auto">
            Health anxiety is exhausting.
            <span className="text-gradient-teal"> We get it.</span>
          </h2>
        </motion.div>
        <motion.div variants={staggerContainer(0.12)} className="grid md:grid-cols-3 gap-6">
          <PainCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            title="The Googling spiral"
            description="You notice a sensation, Google it, and 45 minutes later you've convinced yourself of three rare diagnoses. The relief never comes — just more questions."
          />
          <PainCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            title="3am panic mode"
            description="Your heart races in the dark, your chest feels tight, and you're alone with your thoughts. You know it's probably anxiety, but your body won't listen."
          />
          <PainCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
            title="Knowing, but still spiralling"
            description="You've been told nothing is wrong. You believe it — for a moment. But the cycle starts again within hours. Understanding anxiety isn't enough to stop it."
          />
        </motion.div>
      </Section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-24">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">How it works</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading">Three steps to calmer</h2>
              <p className="text-body mt-4 max-w-xl mx-auto">Anchor meets you where you are — in the middle of a spiral, or building resilience day by day.</p>
            </motion.div>
            <div className="flex flex-col gap-24 md:gap-32">
              {[
                { num: '1', title: 'Check in', src: '/screens/checkin.png', pos: '50% 35%', description: 'Describe what you\'re feeling or what you just read. Anchor listens and asks what it needs to understand you properly.' },
                { num: '2', title: 'Get perspective', src: '/screens/patterns.png', pos: '50% 12%', description: 'Anchor analyses what\'s likely going on and gives you a calm, honest read on your patterns — no alarm, no dismissal.' },
                { num: '3', title: 'Build resilience', src: '/screens/home.png', pos: '50% 12%', description: 'Every worry you work through is logged as proof. Anchor surfaces your progress so you can see how far you\'ve come.' },
              ].map((step, i) => {
                const imgFirst = i % 2 === 0
                return (
                  <div key={i} className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    {/* Phone frame */}
                    <motion.div
                      variants={imgFirst ? fadeInLeft(0, 60) : { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } } }}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: '-80px' }}
                      className={imgFirst ? 'order-1' : 'order-1 md:order-2'}
                    >
                      <div className="mx-auto relative" style={{ width: 240 }}>
                        <div className="absolute -inset-3 rounded-[44px] pointer-events-none" style={{ border: '1px solid var(--color-border)' }} />
                        <div className="relative rounded-[36px] overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 rounded-b-2xl z-10" style={{ background: 'var(--color-surface)' }} />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.src}
                            alt={`Anchor app — ${step.title}`}
                            loading="lazy"
                            className="w-full select-none"
                            style={{ aspectRatio: '240 / 520', objectFit: 'cover', objectPosition: step.pos }}
                            draggable={false}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Text + decorative giant number */}
                    <motion.div
                      variants={imgFirst ? { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } } } : fadeInLeft(0, 60)}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: '-80px' }}
                      className={`relative ${imgFirst ? 'order-2' : 'order-2 md:order-1'}`}
                    >
                      <span
                        className="absolute font-lora font-bold pointer-events-none select-none leading-none"
                        style={{ fontSize: 140, color: 'var(--color-accent)', opacity: 0.08, top: -40, [imgFirst ? 'left' : 'right']: -10 }}
                      >
                        {step.num}
                      </span>
                      <div className="relative">
                        <h3 className="font-lora text-2xl md:text-3xl font-bold text-heading mb-4">{step.title}</h3>
                        <p className="text-body leading-relaxed max-w-md">{step.description}</p>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </Section>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-28" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-16">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Features</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading mb-4">Everything you need to manage health anxiety</h2>
              <p className="text-body max-w-xl mx-auto">Start with the free tier. Unlock deeper tools with Anchor Plus.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12 items-start">
              {/* Free column */}
              <div>
                <motion.p variants={fadeUp(0.05)} className="text-heading text-sm font-semibold uppercase tracking-widest mb-7 flex items-center gap-3">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ec8dc' }}>Free</span>
                  Free forever
                </motion.p>
                <motion.div variants={staggerContainer(0.06)} className="flex flex-col gap-6">
                  {[
                    { title: 'AI Check-in', desc: 'Describe what you\'re feeling or what you just read. Anchor converses with you, then gives calm evidence-based perspective — not alarm, not dismissal.' },
                    { title: '7 Grounding Exercises', desc: 'Box breathing, physiological sigh, 5-4-3-2-1, body scan, worry postponement, safe place, cognitive defusion — guided and tap-through, no audio required.' },
                    { title: 'Daily Journal', desc: 'Structured prompts and free writing with mood tracking. Private entries, only ever visible to you.' },
                    { title: 'Mood Tracking', desc: 'Log how you\'re feeling each day. Anchor tracks your streak and shows your mood history over time.' },
                    { title: 'Weekly PHQ-4 Check-in', desc: 'A validated 4-question screening for anxiety and depression. Takes 30 seconds, shows up once a week.' },
                    { title: 'Learn Library', desc: 'Six evidence-based lessons covering the most common health anxiety spirals — cardiac, neurological, respiratory, digestive, skin, and general.' },
                  ].map((f) => (
                    <FeatureRow key={f.title} title={f.title} description={f.desc} />
                  ))}
                </motion.div>
              </div>

              {/* Plus column — tinted */}
              <motion.div variants={fadeUp(0.1)} className="rounded-2xl p-8" style={{ background: 'rgba(78,205,196,0.05)', border: '1px solid rgba(78,205,196,0.15)' }}>
                <p className="text-heading text-sm font-semibold uppercase tracking-widest mb-7 flex items-center gap-3">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px]" style={{ background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4' }}>Plus</span>
                  Anchor Plus — deeper tools for lasting change
                </p>
                <motion.div variants={staggerContainer(0.06)} className="flex flex-col gap-6">
                  {[
                    { title: 'Unlimited Check-ins', desc: 'Free gives you one AI check-in a week. Plus removes the limit entirely — check in as often as a worry comes up.' },
                    { title: 'Check-in Insights Breakdown', desc: 'The full structured analysis behind every check-in — what\'s likely going on, what would actually matter, and why.' },
                    { title: 'Full Pattern Analysis', desc: 'See your anxiety broken down by trigger category, time of day, and day of week. Understand what\'s actually driving your spikes.' },
                    { title: 'GP Health Summary', desc: 'Auto-generated summary of your check-in history. Print or share it before any GP or therapy appointment.' },
                    { title: 'Monthly Letter from Anchor', desc: 'A personalised monthly reflection written from your own data — your progress, patterns, and what to focus on next.' },
                    { title: 'Early Access to New Features', desc: 'Plus members get new features first, before they roll out to the free tier.' },
                  ].map((f) => (
                    <FeatureRow key={f.title} title={f.title} description={f.desc} isPlus />
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </Section>
        </div>
      </section>

      {/* ─── EVIDENCE / WHY IT WORKS ─────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 1000, height: 600, background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Why it works</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading mb-4">Built on what actually works</h2>
              <p className="text-body leading-relaxed">
                Anchor isn&apos;t a chatbot with a wellness coat of paint. Every tool is drawn from the
                cognitive-behavioural techniques clinicians use to help people manage health anxiety.
              </p>
            </motion.div>
            <motion.div variants={staggerContainer(0.12)} className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 0 6 3 3 0 0 0 3 3 3 3 0 0 0 6 0 3 3 0 0 0 3-3 3 3 0 0 0 0-6 3 3 0 0 0-3-3 3 3 0 0 0-3-3z"/><path d="M12 5v16"/></svg>,
                  title: 'Cognitive Behavioural Therapy',
                  desc: 'The most-studied, most-effective approach for health anxiety. Anchor turns its core techniques into something you can reach for in the moment a spiral starts.',
                },
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                  title: 'Validated screening (PHQ-4)',
                  desc: 'The same four-question measure used in clinical settings — so you can track how you\'re genuinely doing over time, not just how today happens to feel.',
                },
                {
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
                  title: 'Behavioural experiments',
                  desc: 'The gold-standard technique for breaking the reassurance-seeking cycle: predict what you fear will happen, test it, and learn from what actually does.',
                },
              ].map((p) => (
                <motion.div key={p.title} variants={fadeUp(0, 24)}
                  className="pt-7"
                  style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="mb-5">{p.icon}</div>
                  <h3 className="font-lora text-[22px] font-normal text-heading mb-3">{p.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--color-muted)', fontWeight: 300 }}>{p.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fadeUp(0.1)} className="text-muted text-xs text-center mt-10 max-w-xl mx-auto leading-relaxed">
              Anchor is a self-help tool, not a medical device, and doesn&apos;t replace professional care.
              If you&apos;re in crisis, please contact your local emergency services.
            </motion.p>
          </Section>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 700, height: 500, background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.07) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-12">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Pricing</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading mb-4">Start free. Go deeper when you're ready.</h2>
              <p className="text-body max-w-xl mx-auto mb-8">No pressure. The free tier is genuinely useful. Anchor Plus unlocks everything for less than a coffee a week.</p>

              {/* Toggle */}
              <motion.div variants={fadeUp(0.1)} className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['Monthly', 'Annual'].map((t) => (
                  <motion.button key={t} onClick={() => setIsAnnual(t === 'Annual')} layout
                    className="relative px-5 py-2 text-sm font-medium rounded-full transition-colors"
                    style={{ color: (isAnnual ? t === 'Annual' : t === 'Monthly') ? '#0a1628' : '#9ec8dc' }}>
                    {(isAnnual ? t === 'Annual' : t === 'Monthly') && (
                      <motion.div layoutId="togglePill" className="absolute inset-0 rounded-full" style={{ background: '#4ecdc4' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    )}
                    <span className="relative z-10">{t}</span>
                    {t === 'Annual' && (
                      <span className="relative z-10 ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: isAnnual ? 'rgba(10,22,40,0.2)' : 'rgba(78,205,196,0.15)', color: isAnnual ? '#0a1628' : '#4ecdc4' }}>
                        Save 49%
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={staggerContainer(0.1)} className="grid md:grid-cols-3 gap-6 items-start">
              <PricingCard tier="Free" price="Free" description="A solid toolkit for understanding and managing health anxiety, at no cost."
                features={['1 AI check-in per week', '7 grounding exercises', 'Daily journal & mood tracking', 'Weekly PHQ-4 screening', 'Full check-in history', 'Learn library (6 lessons)']}
                cta="Join the waitlist" isAnnual={isAnnual} />
              <PricingCard tier="Anchor Plus" price="A$12.99" annualPrice="A$6.67"
                description="Unlimited check-ins, full pattern analysis, and tools for lasting change."
                features={['Everything in Free', 'Unlimited check-ins', 'Check-in insights breakdown', 'Full patterns & trigger analysis', 'GP health summary', 'Monthly letter from Anchor', 'Early access to new features']}
                cta="Join the waitlist" highlighted isAnnual={isAnnual} />
              <PricingCard tier="Clinical" price="Custom"
                description="For mental health clinics and practices who want to recommend Anchor to clients."
                features={['Everything in Plus', 'Clinician dashboard', 'Client progress sharing', 'White-label option', 'Bulk licensing', 'Dedicated onboarding']}
                cta="Join the waitlist" comingSoon isAnnual={isAnnual} />
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ─── SUPPORT / FAQ / CONTACT ──────────────────────────────────────── */}
      <section id="support" className="py-28" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-20">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Support</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading">We're here to help</h2>
              <p className="text-body mt-4 max-w-lg mx-auto">Find answers below, or get in touch. We aim to respond within 24 hours.</p>
            </motion.div>
            <motion.div variants={staggerContainer(0.1)} className="grid md:grid-cols-2 gap-8 mb-24">
              {faqCategories.map((cat) => (
                <motion.div key={cat.category} variants={fadeUp(0, 20)} className="rounded-2xl p-8"
                  style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex items-center">{cat.icon}</span>
                    <h3 className="font-lora text-lg font-bold text-heading">{cat.category}</h3>
                  </div>
                  <div>{cat.items.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}</div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={staggerContainer(0.1)} className="max-w-2xl mx-auto">
              <motion.div variants={fadeUp(0)} className="text-center mb-10">
                <h3 className="font-lora text-3xl font-bold text-heading mb-3">Still need help?</h3>
                <p className="text-body">Send us a message and we'll get back to you within 24 hours.</p>
              </motion.div>
              <motion.div variants={fadeUp(0.05, 20)} className="rounded-2xl p-8"
                style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
                <ContactForm />
                <p className="text-muted text-xs text-center mt-4">We aim to respond within 24 hours · hello@getanchorhealth.app</p>
              </motion.div>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ─── WAITLIST CTA ────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center relative overflow-hidden py-28">
        <motion.div animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 5, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.1) 0%, transparent 60%)' }} />
        <SineWaves />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative w-full">
          <Section>
            <motion.div variants={fadeUp(0)}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
                style={{ background: 'rgba(78,205,196,0.1)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-teal" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                Coming to the App Store
              </div>
            </motion.div>
            <motion.h2 variants={fadeUp(0.05)} className="font-lora text-4xl md:text-6xl font-bold text-heading mb-6">
              You deserve to feel<br />
              <span className="text-gradient-teal">calm again.</span>
            </motion.h2>
            <motion.p variants={fadeUp(0.1)} className="text-body text-lg max-w-xl mx-auto mb-10">
              Join people breaking the health anxiety cycle — one check-in at a time. We'll email you the day Anchor goes live.
            </motion.p>
            <motion.div variants={fadeUp(0.15)} className="flex flex-col items-center gap-4">
              <WaitlistForm large source="footer" />
              <div className="flex items-center gap-3 mt-2">
                <ComingSoonBadge large />
              </div>
              <p className="text-muted text-sm">No spam. One email when we launch.</p>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col gap-6">
          {/* Row 1: logo + wordmark left, nav links right */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4ecdc4, #a8edea)' }}>
                <svg width="16" height="16" viewBox="0 0 96 96" fill="none" stroke="#0a1628" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="48" cy="28" r="10" fill="none" />
                  <line x1="48" y1="38" x2="48" y2="72" />
                  <line x1="28" y1="52" x2="68" y2="52" />
                  <path d="M28 72 C28 80 37 84 48 84 C59 84 68 80 68 72" />
                </svg>
              </div>
              <span className="font-lora text-lg font-bold text-heading">Anchor</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
              <a href="#features" className="hover:text-body transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-body transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-body transition-colors">Pricing</a>
              <a href="#support" className="hover:text-body transition-colors">Support</a>
            </nav>
          </div>
          {/* Row 2: copyright left, Privacy · Terms right */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-muted text-xs">© 2026 Anchor Health Ltd</p>
            <div className="flex items-center gap-6 text-sm text-muted">
              <a href="https://app.getanchorhealth.app/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-body transition-colors">Privacy</a>
              <a href="https://app.getanchorhealth.app/terms" target="_blank" rel="noopener noreferrer" className="hover:text-body transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
