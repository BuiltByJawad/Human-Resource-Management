import { Card } from '@/components/ui/FormComponents'

interface LeavePolicyAccessCardProps {
  canManage: boolean
}

export const LeavePolicyAccessCard = ({ canManage }: LeavePolicyAccessCardProps) => {
  if (canManage) return null

  return (
    <Card title="Access Restricted">
      <p className="text-sm text-gray-600">You do not have permission to manage leave policies.</p>
    </Card>
  )
}
