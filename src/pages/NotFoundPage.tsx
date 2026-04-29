import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">404</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-slate-300">
          The route you requested does not exist in this portal. Head back to the login page and
          we’ll route you correctly from there.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#0f766e)] px-5 py-3 font-semibold text-slate-950"
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}
