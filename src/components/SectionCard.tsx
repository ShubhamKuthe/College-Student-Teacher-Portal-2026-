import type { PropsWithChildren, ReactNode } from 'react'

interface SectionCardProps extends PropsWithChildren {
  id?: string
  title: string
  description: string
  action?: ReactNode
  variant?: 'default' | 'adminMono'
}

export function SectionCard({
  id,
  title,
  description,
  action,
  children,
  variant = 'default',
}: SectionCardProps) {
  if (variant === 'adminMono') {
    return (
      <section
        id={id}
        className="rounded-[2rem] border border-[#f6d456]/16 bg-[linear-gradient(180deg,rgba(20,21,25,0.98),rgba(10,11,14,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-medium tracking-[-0.04em] text-white">
              {title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm uppercase tracking-[0.2em] text-[#f6d456]/70">
              {description}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <div className="mt-6">{children}</div>
      </section>
    )
  }

  return (
    <section
      id={id}
      className="rounded-[2rem] border border-[#f6d456]/14 bg-[linear-gradient(180deg,rgba(18,20,25,0.98),rgba(11,12,16,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/64">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}
