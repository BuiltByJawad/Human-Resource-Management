interface OffboardingHeaderProps {
  totalProcesses: number
}

export function OffboardingHeader({ totalProcesses }: OffboardingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offboarding</h1>
        <p className="text-sm text-gray-600">Track exit processes, tasks, and responsibilities.</p>
      </div>
      <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">{totalProcesses} records</span>
    </div>
  )
}
