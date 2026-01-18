"use client"

interface BurnoutShellProps {
  children: React.ReactNode
}

export function BurnoutShell({ children }: BurnoutShellProps) {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
    </div>
  )
}
