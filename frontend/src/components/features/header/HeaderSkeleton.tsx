"use client"

export function HeaderSkeleton() {
  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="md:hidden h-10 w-10 rounded-lg bg-slate-200 animate-pulse" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="hidden sm:flex flex-col gap-2">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 hidden lg:flex" />
          <div className="hidden md:block w-full max-w-sm">
            <div className="h-10 w-full rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="hidden md:flex flex-col gap-2">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  )
}
