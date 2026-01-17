"use client"

import { Modal } from '@/components/ui/Modal'
import { Button, Input, Select } from '@/components/ui/FormComponents'
import type { ScheduleFormState } from '@/hooks/useReportsPage'
import type { ScheduledReport, ScheduledReportRecipientUser } from '@/services/reports/api'

interface ScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  scheduleForm: ScheduleFormState
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>
  editingSchedule: ScheduledReport | null
  departments: Array<{ value: string; label: string }>
  recipients: ScheduledReportRecipientUser[]
  recipientsLoading: boolean
  onToggleRecipient: (userId: string) => void
  onSubmit: () => void
  createLoading?: boolean
  updateLoading?: boolean
}

export function ScheduleFormModal({
  isOpen,
  onClose,
  scheduleForm,
  setScheduleForm,
  editingSchedule,
  departments,
  recipients,
  recipientsLoading,
  onToggleRecipient,
  onSubmit,
  createLoading,
  updateLoading,
}: ScheduleFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSchedule ? 'Edit scheduled report' : 'Create scheduled report'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Name"
          value={scheduleForm.name}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Type"
            value={scheduleForm.type}
            onChange={(v) => setScheduleForm((prev) => ({ ...prev, type: v as ScheduleFormState['type'] }))}
            options={[
              { value: 'employees', label: 'Employees' },
              { value: 'attendance', label: 'Attendance' },
              { value: 'leave', label: 'Leave' },
              { value: 'payroll', label: 'Payroll' },
            ]}
          />

          <Select
            label="Format"
            value={scheduleForm.format}
            onChange={(v) => setScheduleForm((prev) => ({ ...prev, format: v as ScheduleFormState['format'] }))}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'pdf', label: 'PDF' },
            ]}
          />

          <Select
            label="Frequency"
            value={scheduleForm.frequency}
            onChange={(v) => setScheduleForm((prev) => ({ ...prev, frequency: v as ScheduleFormState['frequency'] }))}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date (optional)"
            type="date"
            value={scheduleForm.startDate}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="End Date (optional)"
            type="date"
            value={scheduleForm.endDate}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <Select
            label="Department (optional)"
            value={scheduleForm.departmentId}
            onChange={(v) => setScheduleForm((prev) => ({ ...prev, departmentId: v }))}
            options={[{ value: '', label: 'All Departments' }, ...departments]}
          />
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900">Recipients</div>
            <div className="text-xs text-gray-500">{scheduleForm.recipientUserIds.length} selected</div>
          </div>

          {recipientsLoading ? (
            <div className="text-sm text-gray-600">Loading recipients...</div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2">
              {(Array.isArray(recipients) ? recipients : []).map((u) => {
                const checked = scheduleForm.recipientUserIds.includes(u.id)
                return (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRecipient(u.id)}
                    />
                    <span className="truncate">{`${u.firstName} ${u.lastName}`.trim() || u.email}</span>
                    <span className="text-xs text-gray-500 truncate">{u.email}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={scheduleForm.isEnabled}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, isEnabled: e.target.checked }))}
          />
          Enabled
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={createLoading || updateLoading}
            onClick={onSubmit}
          >
            {editingSchedule ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
