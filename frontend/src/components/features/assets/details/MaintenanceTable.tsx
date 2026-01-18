import type { MaintenanceLog } from '@/services/assets/types'

interface MaintenanceTableProps {
  logs: MaintenanceLog[]
}

export const MaintenanceTable = ({ logs }: MaintenanceTableProps) => {
  if (logs.length === 0) {
    return <p className="text-center text-gray-500 py-8">No maintenance records found.</p>
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
              Date
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Description
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Cost
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Performed By
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                {new Date(log.date).toLocaleDateString()}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">{log.description}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {log.cost ? `$${log.cost.toLocaleString()}` : '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.performedBy || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
