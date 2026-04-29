import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  note: string
  icon: LucideIcon
  variant?: 'default' | 'adminMono'
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  if (variant === 'adminMono') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-[#f6d456]/16 bg-[linear-gradient(160deg,rgba(20,21,25,0.98),rgba(12,13,16,0.98))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#f6d456]/72">{label}</p>
            <p className="mt-4 font-heading text-4xl font-medium tracking-[-0.05em] text-white">
              {value}
            </p>
          </div>
          <div className="rounded-2xl border border-[#f6d456]/22 bg-[#f6d456]/8 p-3 text-[#f6d456]">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-white/64">{note}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-[#f6d456]/14 bg-[linear-gradient(160deg,rgba(18,20,25,0.98),rgba(12,13,17,0.98))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#f6d456]/70">{label}</p>
          <p className="mt-3 font-heading text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-[#f6d456]/22 bg-[#f6d456]/8 p-3 text-[#f6d456]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-sm text-white/64">{note}</p>
    </motion.div>
  )
}
