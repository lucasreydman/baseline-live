'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:text-emerald-400 transition-colors"
        >
          <span className="text-emerald-400">◈</span>
          Baseline Live
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            Scores
          </Link>
        </nav>
      </div>
    </header>
  )
}
