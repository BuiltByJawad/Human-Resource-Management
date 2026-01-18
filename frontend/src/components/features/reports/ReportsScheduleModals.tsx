import { ScheduleDeleteModal } from '@/components/features/reports/ScheduleDeleteModal'
import { ScheduleFormModal } from '@/components/features/reports/ScheduleFormModal'
import { ScheduleHistoryModal } from '@/components/features/reports/ScheduleHistoryModal'
import type { Dispatch, SetStateAction } from 'react'
import type { ScheduleFormState } from '@/hooks/useReportsPage'
import type { ScheduledReport, ScheduledReportRecipientUser } from '@/services/reports/api'

interface ReportsScheduleModalsProps {
  scheduleModalOpen: boolean
  onCloseScheduleModal: () => void
  scheduleForm: ScheduleFormState
  setScheduleForm: Dispatch<SetStateAction<ScheduleFormState>>
  editingSchedule: ScheduledReport | null
  departments: Array<{ value: string; label: string }>
  recipients: ScheduledReportRecipientUser[]
  recipientsLoading: boolean
  onToggleRecipient: (userId: string) => void
  onSubmitSchedule: () => void
  createLoading: boolean
  updateLoading: boolean
  deleteScheduleOpen: boolean
  onCloseDeleteModal: () => void
  deleteScheduleTarget: ScheduledReport | null
  deleteScheduleLoading: boolean
  onDeleteSchedule: () => void
  scheduleHistoryOpen: boolean
  scheduleHistorySchedule: ScheduledReport | null
  onCloseScheduleHistory: () => void
}

export const ReportsScheduleModals = ({
  scheduleModalOpen,
  onCloseScheduleModal,
  scheduleForm,
  setScheduleForm,
  editingSchedule,
  departments,
  recipients,
  recipientsLoading,
  onToggleRecipient,
  onSubmitSchedule,
  createLoading,
  updateLoading,
  deleteScheduleOpen,
  onCloseDeleteModal,
  deleteScheduleTarget,
  deleteScheduleLoading,
  onDeleteSchedule,
  scheduleHistoryOpen,
  scheduleHistorySchedule,
  onCloseScheduleHistory,
}: ReportsScheduleModalsProps) => (
  <>
    <ScheduleFormModal
      isOpen={scheduleModalOpen}
      onClose={onCloseScheduleModal}
      scheduleForm={scheduleForm}
      setScheduleForm={setScheduleForm}
      editingSchedule={editingSchedule}
      departments={departments}
      recipients={recipients}
      recipientsLoading={recipientsLoading}
      onToggleRecipient={onToggleRecipient}
      onSubmit={onSubmitSchedule}
      createLoading={createLoading}
      updateLoading={updateLoading}
    />

    <ScheduleDeleteModal
      isOpen={deleteScheduleOpen}
      onClose={onCloseDeleteModal}
      targetName={deleteScheduleTarget?.name}
      loading={deleteScheduleLoading}
      onConfirm={onDeleteSchedule}
    />

    <ScheduleHistoryModal
      isOpen={scheduleHistoryOpen}
      schedule={scheduleHistorySchedule}
      onClose={onCloseScheduleHistory}
    />
  </>
)
