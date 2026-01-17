"use client"

interface SummaryCardProps {
  title: string
  data: Record<string, number | string>
}

export function SummaryCard({ title, data }: SummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <span className="h-1 w-8 bg-blue-500 rounded-full mr-3" aria-hidden />
        {title}
      </h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="bg-white rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
          >
            <dt className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">
              {key.replace(/_/g, ' ')}
            </dt>
            <dd className="text-xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
