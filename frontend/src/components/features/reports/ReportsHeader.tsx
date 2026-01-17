"use client"

interface ReportsHeaderProps {
  title: string
  subtitle?: string
}

export function ReportsHeader({ title, subtitle }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      {subtitle ? <p className="text-sm text-gray-600 max-w-3xl">{subtitle}</p> : null}
    </div>
  )
}
