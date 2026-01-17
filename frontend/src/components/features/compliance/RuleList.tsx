import { DataTable, type Column } from '@/components/ui/DataTable'
import type { ComplianceRule } from '@/services/compliance/types'

interface RuleListProps {
  rules: ComplianceRule[]
  onToggle: (id: string) => void
}

export function RuleList({ rules, onToggle }: RuleListProps) {
  const columns: Column<ComplianceRule>[] = [
    { header: 'Name', key: 'name' },
    { header: 'Type', key: 'type' },
    { header: 'Threshold', key: 'threshold', render: (val) => `${val} hours` },
    {
      header: 'Status',
      key: 'isActive',
      render: (val, rule) => (
        <button
          onClick={() => onToggle(rule.id)}
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {val ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ]

  return <DataTable data={rules} columns={columns} searchKeys={['name', 'type']} />
}
