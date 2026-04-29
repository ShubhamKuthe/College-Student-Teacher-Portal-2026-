interface LoadingScreenProps {
  label?: string
}

export function LoadingScreen({ label = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/25 border-t-cyan-300" />
        <div>
          <p className="font-heading text-2xl font-semibold tracking-tight">College Portal</p>
          <p className="mt-2 text-sm text-slate-300">{label}</p>
        </div>
      </div>
    </div>
  )
}
