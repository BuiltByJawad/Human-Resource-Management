import { Card } from '@/components/ui/FormComponents'

interface HolidayCalendarCardProps {
  holidaysText: string
  onChange: (value: string) => void
  canManage: boolean
}

export const HolidayCalendarCard = ({
  holidaysText,
  onChange,
  canManage,
}: HolidayCalendarCardProps) => (
  <Card title="Holiday Calendar">
    <p className="text-sm text-gray-600 mb-3">
      One date per line in YYYY-MM-DD format. Holidays are excluded from business day calculations.
    </p>
    <textarea
      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
      rows={8}
      value={holidaysText}
      onChange={(e) => onChange(e.target.value)}
      placeholder="2026-01-01\n2026-03-26"
      disabled={!canManage}
    />
  </Card>
)
