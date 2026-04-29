import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { hasFirebaseConfig } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardPath, type Role } from '../types/models'

const campusSlides = [
  {
    image:
      'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80',
    title: 'Central campus life',
    note: 'A welcoming front stage for students, teachers, and administrators.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80',
    title: 'Academic focus',
    note: 'Assignments, attendance, feedback, and schedules in one clean workspace.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=80',
    title: 'Faculty coordination',
    note: 'Teachers can publish materials, mark attendance, and grade in real time.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1400&q=80',
    title: 'Connected learning',
    note: 'Built to keep classrooms, coursework, and announcements aligned.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
    title: 'Modern campus portal',
    note: 'A bright, responsive system designed around daily college operations.',
  },
]

const roleOptions: Array<{ label: string; value: Role }> = [
  { label: 'Admin', value: 'admin' },
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { profile, loading, signIn, authMessage, clearAuthMessage } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [selectedRole, setSelectedRole] = useState<Role>('admin')

  useEffect(() => {
    if (profile) {
      navigate(getDashboardPath(profile.role), { replace: true })
    }
  }, [navigate, profile])

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % campusSlides.length)
    }, 6800)

    return () => window.clearInterval(slideTimer)
  }, [])

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(clockTimer)
  }, [])

  if (profile) {
    return <Navigate to={getDashboardPath(profile.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await signIn(email, password)
    } catch {
      // Error state is handled in the auth context.
    } finally {
      setSubmitting(false)
    }
  }

  const currentSlide = campusSlides[activeSlide]
  const selectedRoleLabel =
    roleOptions.find((option) => option.value === selectedRole)?.label ?? 'Admin'
  const liveDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
  const liveTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now)

  return (
    <div className="h-screen overflow-hidden bg-[#fffdf2] px-3 py-3 text-slate-950 sm:px-4 lg:px-5">
      <div className="relative mx-auto grid h-[calc(100vh-1.5rem)] w-full max-w-[1800px] overflow-hidden rounded-[2.25rem] border border-[#eadfbb] bg-white shadow-[0_30px_120px_rgba(219,183,67,0.18)] lg:grid-cols-[1.72fr_0.72fr]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,216,79,0.28),transparent_68%)]" />

        <section className="relative flex min-h-0 flex-col overflow-hidden border-b border-[#efe2b6] bg-[#fffdf5] lg:border-b-0 lg:border-r">
          <div className="absolute inset-0">
            {campusSlides.map((slide, index) => (
              <div
                key={slide.image}
                className={`absolute inset-0 transition-opacity duration-[2600ms] ${
                  index === activeSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,253,245,0.96)_18%,rgba(255,248,215,0.8)_48%,rgba(255,245,199,0.34)_100%)]" />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex h-full flex-1 flex-col justify-between px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#f0d76d] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#8a6400] backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f2bf22]" />
                College Portal
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur md:inline-flex">
                <ShieldCheck className="h-4 w-4 text-[#c69210]" />
                Secure campus sign-in
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center px-2 py-8 lg:justify-start lg:py-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full"
              >
                <h1 className="font-heading text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:max-w-3xl lg:text-7xl">
                  OUR CAMPUSES
                </h1>
                <p className="mt-6 pl-1 text-sm font-medium uppercase tracking-[0.24em] text-[#8a6400]/80 sm:pl-1.5">
                  {currentSlide.title}
                </p>
              </motion.div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {campusSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show campus slide ${index + 1}`}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      index === activeSlide
                        ? 'border-[#f1c330] bg-[#f6d456] text-slate-950 shadow-[0_14px_28px_rgba(242,191,34,0.2)]'
                        : 'border-[#eadfbb] bg-white/90 text-slate-700 hover:border-[#e6c95d] hover:bg-[#fff4c2]'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <p className="text-sm font-medium text-slate-700">
                  Built by <span className="font-semibold text-slate-950">Shubham Kuthe</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex bg-[#3d4349]"
        >
          <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#f6d456]/18 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-white/8 blur-3xl" />

          <div className="relative flex h-full w-full flex-col overflow-hidden px-5 py-5 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#f6d456]">
                Login panel
              </p>
              <h2 className="mt-3 max-w-xs font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white xl:text-5xl">
                Hi {selectedRoleLabel}
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-[1.25rem] border border-white/8 bg-[#111418] p-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedRole(option.value)}
                    className={`rounded-[0.95rem] px-3 py-2.5 text-sm font-semibold transition ${
                      option.value === selectedRole
                        ? 'bg-[#f6d456] text-slate-950'
                        : 'bg-transparent text-white/72 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[1.9rem] border border-white/8 bg-[#0f1114] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5">
              {authMessage ? (
                <div className="mb-5 rounded-[1.6rem] border border-[#f6d456]/25 bg-[#f6d456]/10 p-4 text-sm text-[#fff4c2]">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f6d456]" />
                    <div>
                      <p className="font-semibold">Sign-in issue</p>
                      <p className="mt-1 leading-6 text-[#f5edd1]">{authMessage}</p>
                      <button
                        type="button"
                        onClick={clearAuthMessage}
                        className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f6d456]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {!hasFirebaseConfig ? (
                <div className="mb-5 rounded-[1.6rem] border border-[#f6d456]/25 bg-[#f6d456]/10 p-4 text-sm text-[#fff4c2]">
                  Add your `VITE_FIREBASE_*` values before testing sign-in.
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-[1.2rem] border border-[#f6d456]/16 bg-[#f6d456]/8 px-4 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f6d456]">
                    Active panel
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-white">
                    {selectedRoleLabel} login panel
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium uppercase tracking-[0.14em] text-white/72">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@college.edu"
                    className="h-13 w-full rounded-[1.2rem] border border-white/10 bg-white px-5 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f6d456] focus:ring-4 focus:ring-[#f6d456]/25"
                    required
                    disabled={loading || submitting}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium uppercase tracking-[0.14em] text-white/72">
                    Password
                  </span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                    className="h-13 w-full rounded-[1.2rem] border border-white/10 bg-white pl-11 pr-5 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f6d456] focus:ring-4 focus:ring-[#f6d456]/25"
                    required
                    disabled={loading || submitting}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || submitting}
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[#f6d456] px-4 text-base font-bold text-slate-950 transition hover:bg-[#f0c42d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Enter portal'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

            <div className="mt-auto grid gap-3 pt-4 text-white md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center gap-3 text-[#f6d456]">
                  <CalendarDays className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em]">Today's date</p>
                </div>
                <p className="mt-3 text-base font-medium leading-7 text-white">{liveDate}</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center gap-3 text-[#f6d456]">
                  <Clock3 className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em]">Time</p>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-[0.08em] text-white">{liveTime}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
