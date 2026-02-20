"use client"

interface BurnoutShellProps {
  children: React.ReactNode
}

export function BurnoutShell({ children }: BurnoutShellProps) {
  return (
    <div className="bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  )
}
