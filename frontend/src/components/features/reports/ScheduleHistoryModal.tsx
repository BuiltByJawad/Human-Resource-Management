"use client"

import { format } from 'date-fns'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/FormComponents'
import type { ScheduledReport } from '@/services/reports/api'

interface ScheduleHistoryModalProps {
  isOpen: boolean
  schedule: ScheduledReport | null
  onClose: () => void
}

export function ScheduleHistoryModal({ isOpen, schedule, onClose }: ScheduleHistoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schedule ? `Run history - ${schedule.name}` : 'Run history'}
      size="lg"
    >
      <div className="space-y-3">
        {Array.isArray(schedule?.runs) && schedule.runs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finished</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.deliveredCount}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {r.startedAt ? format(new Date(String(r.startedAt)), 'MMM dd, yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {r.finishedAt ? format(new Date(String(r.finishedAt)), 'MMM dd, yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{r.errorMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No runs recorded yet.</div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
