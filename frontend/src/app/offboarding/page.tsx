"use client"

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { OffboardingProcess, OffboardingTask, getOffboardingProcesses, initiateOffboarding, updateOffboardingTask } from '@/services/offboardingService'
import api from '@/lib/axios'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/FormComponents'

interface EmployeeOption {
  id: string
  name: string
  email: string
}

const taskStatusOptions: OffboardingTask['status'][] = ['pending', 'in_progress', 'completed', 'skipped']

export default function OffboardingAdminPage() {
  const { token, user } = useAuthStore()
  const { showToast } = useToast()
  const [processes, setProcesses] = useState<OffboardingProcess[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ employeeId: '', exitDate: '', reason: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const canManage = useMemo(() => user?.permissions?.includes('offboarding.manage'), [user?.permissions])

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      try {
        const [processResp, employeeResp] = await Promise.all([
          getOffboardingProcesses(),
          api
            .get('/employees', {
              params: { limit: 200 },
              headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => res.data.data?.employees || res.data.data || res.data || [])
        ])
        setProcesses(processResp || [])
        setEmployees(
          employeeResp.map((emp: any) => ({
            id: emp.id,
            name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email,
            email: emp.email
          }))
        )
      } catch (err) {
        console.error(err)
        showToast('Failed to load offboarding data', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, showToast])

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employeeId || !form.exitDate) return
    setSubmitting(true)
    try {
      await initiateOffboarding(form)
      showToast('Offboarding process started', 'success')
      setForm({ employeeId: '', exitDate: '', reason: '', notes: '' })
      const refreshed = await getOffboardingProcesses()
      setProcesses(refreshed || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to initiate offboarding'
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, status: OffboardingTask['status']) => {
    try {
      await updateOffboardingTask(taskId, { status })
      setProcesses((prev) =>
        prev.map((process) => ({
          ...process,
          tasks: process.tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
        }))
      )
      showToast('Task updated', 'success')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update task'
      showToast(message, 'error')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Offboarding</h1>
                <p className="text-sm text-gray-600">Track exit processes, tasks, and responsibilities.</p>
              </div>
            </div>

            {canManage && (
              <section className="bg-white rounded-lg border border-gray-100 shadow p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Initiate Offboarding</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleInitiate}>
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-700">Employee</label>
                    <select
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={form.employeeId}
                      onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                      required
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} • {emp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Exit Date</label>
                    <DatePicker
                      value={form.exitDate}
                      onChange={(date) =>
                        setForm((prev) => ({
                          ...prev,
                          exitDate: date ? format(date, 'yyyy-MM-dd') : ''
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reason</label>
                    <input
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={form.reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="Resignation, termination, etc."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700"
                      disabled={submitting}
                    >
                      {submitting ? 'Initiating...' : 'Start Offboarding'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="bg-white rounded-lg border border-gray-100 shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Processes</h2>
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">{processes.length} records</span>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : processes.length === 0 ? (
                <p className="text-sm text-gray-500">No active offboarding processes.</p>
              ) : (
                <div className="space-y-4">
                  {processes.map((process) => (
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
                        {process.tasks.map((task) => (
                          <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3">
                            <div>
                              <p className="font-medium text-gray-900">{task.title}</p>
                              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                              <p className="text-xs text-gray-500">Assigned to {task.assigneeRole || '—'}</p>
                            </div>
                            {canManage ? (
                              <select
                                className="rounded border border-gray-300 px-3 py-2 text-sm"
                                value={task.status}
                                onChange={(e) => handleTaskUpdate(task.id, e.target.value as OffboardingTask['status'])}
                              >
                                {taskStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">{task.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
