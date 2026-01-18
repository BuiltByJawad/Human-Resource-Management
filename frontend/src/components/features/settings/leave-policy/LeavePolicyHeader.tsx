import { Button } from '@/components/ui/FormComponents'

interface LeavePolicyHeaderProps {
  onBack: () => void
  onSave: () => void
  isSaving: boolean
  canManage: boolean
}

export const LeavePolicyHeader = ({
  onBack,
  onSave,
  isSaving,
  canManage,
}: LeavePolicyHeaderProps) => (
  <div className="flex items-center justify-between">
    <Button variant="outline" onClick={onBack}>
      Back to Settings
    </Button>
    <Button variant="primary" onClick={onSave} disabled={!canManage || isSaving}>
      Save Policy
    </Button>
  </div>
)
