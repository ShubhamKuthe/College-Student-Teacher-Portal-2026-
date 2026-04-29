import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import type { ComponentType, PropsWithChildren } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types/models'

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

interface AppShellProps extends PropsWithChildren {
  title: string
  subtitle: string
  role: Role
  navItems: NavItem[]
  variant?: 'default' | 'adminMono'
}

const roleLabelMap: Record<Role, string> = {
  student: 'Student Workspace',
  teacher: 'Teacher Workspace',
  admin: 'Admin Workspace',
}

export function AppShell({
  title,
  subtitle,
  role,
  navItems,
  children,
  variant = 'default',
}: AppShellProps) {
  const { profile, logout } = useAuth()

  if (variant === 'adminMono') {
    return (
      <div className="min-h-screen bg-[#fffdf2] text-white">
        <div className="min-h-screen bg-[#fffdf2]">
          <header className="grid min-h-24 border-b border-[#4f4631] bg-[linear-gradient(180deg,#1f2228_0%,#2a2e36_100%)] lg:grid-cols-[220px_1fr]">
            <div className="flex items-center bg-[#0a0b0e] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f6d456]">
                  College Portal
                </p>
                <h1 className="mt-2 font-heading text-2xl font-medium tracking-[-0.04em] text-white lg:text-3xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 px-5 py-3 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <nav className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-[#f4edd8]/72">
                  {navItems.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      className="rounded-full border border-[#f6d456]/28 bg-white/4 px-3 py-1.5 transition hover:border-[#f6d456] hover:bg-[#f6d456] hover:text-black"
                    >
                      {label}
                    </a>
                  ))}
                </nav>

                <div className="text-left lg:text-right">
                  <p className="text-sm font-medium text-white lg:text-base">
                    {profile?.email ?? 'email@college.edu'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl border border-[#f6d456]/28 bg-[#f6d456] px-5 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#efc331]"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <p className="max-w-3xl text-[10px] uppercase tracking-[0.18em] text-white/42 lg:text-xs">
                {subtitle}
              </p>
            </div>
          </header>

          <main className="bg-[radial-gradient(circle_at_top,rgba(246,212,86,0.12),transparent_22%),linear-gradient(180deg,#090a0d_0%,#111317_100%)] px-4 py-4 sm:px-6 lg:min-h-[calc(100vh-9rem)] lg:px-8 lg:py-8">
            <div className="grid gap-6">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(246,212,86,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(246,212,86,0.08),transparent_24%),linear-gradient(180deg,#0a0b0e_0%,#12151b_48%,#0b0d10_100%)] text-slate-100">
      <div className="flex min-h-screen w-full flex-col xl:flex-row">
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-b border-[#f6d456]/12 bg-[linear-gradient(180deg,rgba(15,16,20,0.98),rgba(10,11,14,0.96))] px-5 py-6 xl:min-h-screen xl:w-[320px] xl:border-b-0 xl:border-r"
        >
          <div className="rounded-[2rem] border border-[#f6d456]/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(246,212,86,0.05))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <p className="text-sm uppercase tracking-[0.3em] text-[#f6d456]/74">College Portal</p>
            <h1 className="mt-4 font-heading text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-white/68">{subtitle}</p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-[#f6d456]/14 bg-[#0a0b0e] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#f6d456]/56">Signed in as</p>
            <p className="mt-3 font-heading text-xl text-white">{profile?.name ?? 'Portal user'}</p>
            <p className="text-sm text-white/54">{profile?.email}</p>
            <div className="mt-4 inline-flex rounded-full border border-[#f6d456]/18 bg-[#f6d456]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#f8edc5]">
              {roleLabelMap[role]}
            </div>
          </div>

          <nav className="mt-6 grid gap-2">
            {navItems.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl border border-transparent bg-transparent px-4 py-3 text-sm font-medium text-white/78 transition hover:border-[#f6d456]/18 hover:bg-[#f6d456]/8 hover:text-white"
              >
                <Icon className="h-5 w-5 text-[#f6d456]" />
                {label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f6d456]/20 bg-[#f6d456] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#efc331]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </motion.aside>

        <main className="flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-6">
          <div className="grid gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
