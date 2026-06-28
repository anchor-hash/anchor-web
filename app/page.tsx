'use client'

import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
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

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = '',
  duration = 2,
}: {
  target: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) motionVal.set(target)
  }, [inView, motionVal, target])

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(Math.round(v)))
  }, [spring])

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

// ─── Word-by-word hero headline ───────────────────────────────────────────────
function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <motion.h1
      className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.12] text-heading"
      variants={staggerContainer(0.08, 0.3)}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.28em]"
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
      ))}
    </motion.h1>
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
function WaitlistForm({ large = false }: { large?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setStatus(data.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
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
        <span className="text-teal text-sm font-medium">You're on the list — we'll email you the day it goes live.</span>
      </motion.div>
    )
  }

  return (
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

// ─── Rotating Phone Mockup ────────────────────────────────────────────────────
const phoneScreens = [
  { label: 'Home',     src: '/screens/home.png' },
  { label: 'Journal',  src: '/screens/journal.png' },
  { label: 'Check in', src: '/screens/checkin.png' },
  { label: 'Ground',   src: '/screens/ground.png' },
  { label: 'Patterns', src: '/screens/patterns.png' },
]

function PhoneMockup() {
  const [activeScreen, setActiveScreen] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveScreen(s => (s + 1) % phoneScreens.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-5">
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto"
        style={{ width: 260 }}
      >
        {/* Glow under phone */}
        <div
          className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-40 h-10 rounded-full blur-2xl"
          style={{ background: 'rgba(78,205,196,0.25)' }}
        />
        {/* Phone shell — real app screenshots fill the frame edge-to-edge */}
        <div
          className="relative rounded-[40px] overflow-hidden"
          style={{
            width: 260,
            height: 565,
            background: '#0a1628',
            border: '2px solid rgba(78,205,196,0.25)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeScreen}
              src={phoneScreens[activeScreen].src}
              alt={`Anchor app — ${phoneScreens[activeScreen].label} screen`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0 w-full h-full object-cover object-top select-none"
              draggable={false}
            />
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Screen indicator dots */}
      <div className="flex gap-2">
        {phoneScreens.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveScreen(i)}
            aria-label={`Show ${s.label} screen`}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: activeScreen === i ? 20 : 6,
                height: 6,
                background: activeScreen === i ? '#4ecdc4' : 'rgba(78,205,196,0.25)',
              }}
            />
          </button>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: '#5a8ea8' }}>
        {phoneScreens[activeScreen].label}
      </p>
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
  isPlus = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isPlus?: boolean
}) {
  return (
    <motion.div
      variants={fadeUp(0, 24)}
      whileHover={{
        scale: 1.03,
        boxShadow: isPlus
          ? '0 0 32px rgba(78,205,196,0.22), 0 8px 40px rgba(0,0,0,0.5)'
          : '0 0 24px rgba(78,205,196,0.1), 0 8px 32px rgba(0,0,0,0.4)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative rounded-2xl p-6 cursor-default"
      style={{
        background: '#0d1e38',
        border: isPlus ? '1px solid rgba(78,205,196,0.3)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {isPlus && (
        <span
          className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.3)' }}
        >
          Plus
        </span>
      )}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(78,205,196,0.1)' }}
      >
        {icon}
      </div>
      <h3 className="font-lora text-lg font-semibold text-heading mb-2">{title}</h3>
      <p className="text-body text-sm leading-relaxed">{description}</p>
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
      variants={fadeUp(0, 24)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="rounded-2xl p-7"
      style={{
        background: 'linear-gradient(135deg, #0d1e38 0%, #0a1628 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
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
      whileHover={{ y: highlighted ? -10 : -6, scale: highlighted ? 1.02 : 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative rounded-2xl p-8 flex flex-col"
      style={{
        background: highlighted ? 'linear-gradient(135deg, #0f2540 0%, #0d1e38 100%)' : '#0d1e38',
        border: highlighted ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(255,255,255,0.07)',
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

      {/* Coming soon pill — all tiers */}
      <div
        className="text-center rounded-xl py-3.5 text-sm font-semibold"
        style={{
          background: comingSoon
            ? 'rgba(255,255,255,0.04)'
            : highlighted
            ? 'rgba(78,205,196,0.08)'
            : 'rgba(255,255,255,0.04)',
          color: '#5a8ea8',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'default',
        }}
      >
        Coming to the App Store
      </div>
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
        { q: 'Can I delete my account?', a: 'Yes, at any time. In the app, tap More → scroll to the Account section → Delete account. This permanently removes all your data from our servers.' },
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
              Coming to App Store
            </a>
          </motion.div>
        </div>
      </motion.nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section id="waitlist" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Animated background glow */}
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 900, height: 700, background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.13) 0%, transparent 65%)' }}
        />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(78,205,196,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.06) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            {/* Coming soon badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
              style={{ background: 'rgba(78,205,196,0.1)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              Coming to iPhone · Evidence-based CBT
            </motion.div>

            <AnimatedHeadline text="Your mind is racing. Let's slow it down." />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="text-body text-lg leading-relaxed mt-6 mb-8 max-w-lg"
            >
              The calm, evidence-based companion for health anxiety. Track symptoms,
              challenge spirals, and build lasting resilience — right from your iPhone.
            </motion.p>

            {/* Waitlist CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex flex-col gap-4"
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
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center gap-6 mt-10 pt-10 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              {([
                { val: 6, suffix: ' CBT techniques', label: 'built in' },
                { val: 100, suffix: '% private', label: 'your data, yours only' },
                { text: 'No ads. Ever.', label: 'no tracking either' },
              ] as { val?: number; suffix?: string; text?: string; label: string }[]).map((s) => (
                <div key={s.label}>
                  <p className="text-heading text-xl font-bold font-lora">
                    {s.text ? s.text : <AnimatedCounter target={s.val ?? 0} suffix={s.suffix} />}
                  </p>
                  <p className="text-muted text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-center"
          >
            <PhoneMockup />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
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
      <section className="py-5 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, text: 'Free to download on iPhone' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: '100% private — no ads, ever' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>, text: 'Evidence-based CBT techniques' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>, text: 'Cancel anytime — no lock-in' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-muted text-sm">
                <span className="flex items-center">{item.icon}</span>
                {item.text}
                {i < 3 && <span className="ml-10 hidden sm:inline-block text-[#1a3050]">|</span>}
              </motion.div>
            ))}
          </motion.div>
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
      <section id="how-it-works" className="py-28" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-20">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">How it works</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading">Three steps to calmer</h2>
              <p className="text-body mt-4 max-w-xl mx-auto">Anchor meets you where you are — in the middle of a spiral, or building resilience day by day.</p>
            </motion.div>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute top-12 left-[calc(16.67%-1px)] right-[calc(16.67%-1px)] hidden md:block h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(78,205,196,0.3), transparent)' }} />
              <motion.div variants={staggerContainer(0.18)} className="grid md:grid-cols-3 gap-10">
                {[
                  { num: '01', title: 'Check in', description: 'Describe what you\'re feeling or what you just read. Anchor listens and asks what it needs to understand you properly.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                  { num: '02', title: 'Get perspective', description: 'Anchor analyses what\'s likely going on, what would actually matter, and gives you a calm, honest triage — no alarm, no dismissal.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                  { num: '03', title: 'Build resilience', description: 'Your data reveals patterns. Anchor surfaces insights so you can understand your triggers and measure real progress over time.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                ].map((step, i) => (
                  <motion.div key={i} variants={fadeUp(0, 28)} className="flex flex-col items-center md:items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0d1e38, #0a1628)', border: '1px solid rgba(78,205,196,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: '#4ecdc4', color: '#0a1628' }}>
                        {step.num.split('0')[1]}
                      </div>
                    </div>
                    <h3 className="font-lora text-xl font-bold text-heading mb-3">{step.title}</h3>
                    <p className="text-body text-sm leading-relaxed">{step.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </Section>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp(0)} className="text-center mb-6">
              <p className="text-teal text-sm font-medium tracking-widest uppercase mb-4">Features</p>
              <h2 className="font-lora text-4xl md:text-5xl font-bold text-heading mb-4">Everything you need to manage health anxiety</h2>
              <p className="text-body max-w-xl mx-auto">Start with the free tier. Unlock deeper tools with Anchor Plus.</p>
            </motion.div>

            {/* Free features */}
            <motion.div variants={fadeUp(0.08)} className="mb-4 mt-16">
              <p className="text-heading text-sm font-semibold uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="inline-block px-3 py-1 rounded-full text-[11px]" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ec8dc' }}>Free</span>
                Free forever
              </p>
            </motion.div>
            <motion.div variants={staggerContainer(0.08)} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: 'AI Check-in', desc: 'Describe what you\'re feeling or what you just read. Anchor converses with you, then gives calm evidence-based perspective — not alarm, not dismissal.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9 C3.5 6, 5 6, 6.5 9 C8 12, 9.5 12, 11 9 C12.5 6, 14 6, 15.5 9 C17 12, 18.5 12, 20 9"/><path d="M2 16 C3.5 13, 5 13, 6.5 16 C8 19, 9.5 19, 11 16 C12.5 13, 14 13, 15.5 16 C17 19, 18.5 19, 20 16"/></svg>, title: '6 Grounding Exercises', desc: 'Box breathing, physiological sigh, 5-4-3-2-1, body scan, worry postponement, cognitive defusion — guided and tap-through, no audio required.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, title: 'Daily Journal', desc: 'Structured prompts and free writing with mood tracking. Private entries, only ever visible to you.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Mood Tracking', desc: 'Log how you\'re feeling each day. Anchor tracks your streak and shows your mood history over time.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: 'Weekly PHQ-4 Check-in', desc: 'A validated 4-question screening for anxiety and depression. Takes 30 seconds, shows up once a week.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, title: 'Learn Library', desc: 'Six evidence-based lessons covering the most common health anxiety spirals — cardiac, neurological, respiratory, digestive, skin, and general.' },
              ].map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.desc} />
              ))}
            </motion.div>

            {/* Plus features */}
            <motion.div variants={fadeUp(0.08)} className="mb-6">
              <p className="text-heading text-sm font-semibold uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="inline-block px-3 py-1 rounded-full text-[11px]" style={{ background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4' }}>Plus</span>
                Anchor Plus — deeper tools for lasting change
              </p>
            </motion.div>
            <motion.div variants={staggerContainer(0.08)} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: 'Complete Check-in History', desc: 'Every check-in saved and searchable. Free users see their last 3 — Plus keeps every single one.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Full Pattern Analysis', desc: 'See your anxiety broken down by trigger category, time of day, and day of week. Understand what\'s actually driving your spikes.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, title: 'Behavioural Experiment Tracker', desc: 'Log a worry, predict what will happen, then record the outcome. The most evidence-backed way to break the anxiety cycle.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: 'GP Health Summary', desc: 'Auto-generated summary of your check-in history. Print or share it before any GP or therapy appointment.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: 'Monthly Letter from Anchor', desc: 'A personalised monthly reflection written from your own data — your progress, patterns, and what to focus on next.' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Early Access to New Features', desc: 'Plus members get new features first, before they roll out to the free tier.' },
              ].map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.desc} isPlus />
              ))}
            </motion.div>
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
                <motion.div key={p.title} variants={fadeUp(0, 24)} whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="rounded-2xl p-7"
                  style={{ background: '#0d1e38', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(78,205,196,0.1)' }}>{p.icon}</div>
                  <h3 className="font-lora text-lg font-bold text-heading mb-3">{p.title}</h3>
                  <p className="text-body text-sm leading-relaxed">{p.desc}</p>
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
              <motion.div variants={fadeUp(0.1)} className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: '#0d1e38', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                features={['Unlimited AI check-ins', '6 grounding exercises', 'Daily journal & mood tracking', 'Weekly PHQ-4 screening', 'Last 3 check-ins saved', 'Learn library (6 lessons)']}
                cta="Coming to the App Store" isAnnual={isAnnual} />
              <PricingCard tier="Anchor Plus" price="A$12.99" annualPrice="A$6.67"
                description="Complete check-in history, full pattern analysis, and tools for lasting change."
                features={['Everything in Free', 'Complete check-in history', 'Full patterns & trigger analysis', 'Behavioural experiment tracker', 'GP health summary', 'Monthly letter from Anchor', 'Early access to new features']}
                cta="Coming to the App Store" highlighted isAnnual={isAnnual} />
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
                  style={{ background: '#0d1e38', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
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
                style={{ background: '#0d1e38', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
                <ContactForm />
                <p className="text-muted text-xs text-center mt-4">We aim to respond within 24 hours · hello@getanchorhealth.app</p>
              </motion.div>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ─── WAITLIST CTA ────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <motion.div animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 5, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(78,205,196,0.1) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
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
              <WaitlistForm large />
              <div className="flex items-center gap-3 mt-2">
                <ComingSoonBadge large />
              </div>
              <p className="text-muted text-sm">No spam. One email when we launch.</p>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="py-14 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
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
              <a href="https://app.getanchorhealth.app/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-body transition-colors">Privacy</a>
              <a href="https://app.getanchorhealth.app/terms" target="_blank" rel="noopener noreferrer" className="hover:text-body transition-colors">Terms</a>
            </nav>
            <p className="text-muted text-xs">© 2026 Anchor Health Ltd</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
