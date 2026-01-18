import { DataTable, type Column } from '@/components/ui/DataTable'
import type { ComplianceLog } from '@/services/compliance/types'

interface ViolationLogProps {
  logs: ComplianceLog[]
}

export function ViolationLog({ logs }: ViolationLogProps) {
  const columns: Column<ComplianceLog>[] = [
    {
      header: 'Date',
      key: 'violationDate',
      render: (val) => new Date(String(val)).toLocaleDateString(),
    },
    {
      header: 'Employee',
      key: 'employee',
      render: (val: ComplianceLog['employee']) => `${val.firstName} ${val.lastName}`,
    },
    {
      header: 'Rule',
      key: 'rule',
      render: (val: ComplianceLog['rule']) => val.name,
    },
    { header: 'Details', key: 'details' },
    {
      header: 'Status',
      key: 'status',
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            val === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {String(val).toUpperCase()}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      data={logs}
      columns={columns}
      searchKeys={['employee.firstName', 'employee.lastName', 'rule.name', 'details', 'status']}
    />
  )
}
