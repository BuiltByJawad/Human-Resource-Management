import { format } from 'date-fns'
import type { OffboardingProcess, OffboardingTask } from '@/services/offboarding/types'

interface OffboardingProcessListProps {
  processes: OffboardingProcess[]
  canManage: boolean
  isLoading: boolean
  onTaskUpdate: (taskId: string, status: OffboardingTask['status']) => void
}

const taskStatusOptions: OffboardingTask['status'][] = ['pending', 'in_progress', 'completed', 'skipped']

export function OffboardingProcessList({ processes, canManage, isLoading, onTaskUpdate }: OffboardingProcessListProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-100 shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Processes</h2>
        <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">{processes.length} records</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : processes.length === 0 ? (
        <p className="text-sm text-gray-500">No active offboarding processes.</p>
      ) : (
        <div className="space-y-4">
          {processes.map((process) => {
            const tasks = Array.isArray(process.tasks) ? process.tasks : []
            return (
              <div key={process.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {process.employee?.firstName} {process.employee?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Exit date {process.exitDate ? format(new Date(process.exitDate), 'PP') : '—'} · {process.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                        <p className="text-xs text-gray-500">Assigned to {task.assigneeRole || '—'}</p>
                      </div>
                      {canManage ? (
                        <select
                          className="rounded border border-gray-300 px-3 py-2 text-sm"
                          value={task.status}
                          onChange={(e) => onTaskUpdate(task.id, e.target.value as OffboardingTask['status'])}
                        >
                          {taskStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {task.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
