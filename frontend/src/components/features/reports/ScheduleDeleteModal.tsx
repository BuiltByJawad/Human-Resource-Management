"use client"

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/FormComponents'

interface ScheduleDeleteModalProps {
  isOpen: boolean
  targetName?: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ScheduleDeleteModal({ isOpen, targetName, loading, onClose, onConfirm }: ScheduleDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete scheduled report"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete <span className="font-medium">{targetName ?? 'this schedule'}</span>? This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
