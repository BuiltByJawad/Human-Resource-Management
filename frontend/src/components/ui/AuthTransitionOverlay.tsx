'use client'

import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthTransitionOverlay() {
  const { isAuthTransition } = useAuthStore()

  const overlay = useMemo(() => {
    if (typeof document === 'undefined') return null
    if (!isAuthTransition) return null

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-white backdrop-blur-2xl">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 -top-14 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl animate-workspace-wave" />
          <div className="absolute -right-24 -bottom-16 h-64 w-64 rounded-full bg-blue-200/45 blur-3xl animate-workspace-wave" />
        </div>
        <div className="relative flex flex-col items-center gap-4 px-7 py-6 rounded-3xl bg-white/92 border border-white/60 shadow-[0_25px_80px_-35px_rgba(59,130,246,0.45)] backdrop-blur-xl">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/25 flex items-center justify-center animate-workspace-pulse">
            <div className="absolute inset-0 rounded-2xl bg-white/15 animate-workspace-pulse" />
            <div className="h-7 w-7 rounded-xl bg-white/90 text-sky-600 font-semibold flex items-center justify-center shadow-inner">
              HR
            </div>
          </div>
          <div className="w-56 h-[10px] rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 opacity-70 blur-sm animate-workspace-slide" />
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 animate-workspace-slide" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 tracking-tight">Preparing your workspace…</p>
          <p className="text-xs text-slate-500">Optimizing dashboard data & routes</p>
        </div>
      </div>,
      document.body
    )
  }, [isAuthTransition])

  return overlay
}
