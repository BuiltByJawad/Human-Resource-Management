"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/store/useAuthStore"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const runLogout = async () => {
      try {
        await useAuthStore.getState().logout()
      } finally {
        if (!isMounted) return
        router.replace("/login")
        try {
          useAuthStore.getState().endAuthTransition()
        } catch {
        }
      }
    }

    void runLogout()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-white">
      <div className="flex flex-col items-center gap-4 px-7 py-6 rounded-3xl bg-white/92 border border-white/60 shadow-[0_25px_80px_-35px_rgba(59,130,246,0.45)] backdrop-blur-xl">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/25 flex items-center justify-center">
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
        <p className="text-sm font-semibold text-slate-700 tracking-tight">Signing you out…</p>
      </div>
    </div>
  )
}
