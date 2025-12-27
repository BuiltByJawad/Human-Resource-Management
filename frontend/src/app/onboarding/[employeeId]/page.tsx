"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  startOnboardingProcess,
  getOnboardingProcess,
  createOnboardingTask,
  completeOnboardingTask,
  OnboardingTaskPayload
} from '@/services/onboardingService'
import { useAuthStore } from '@/store/useAuthStore'
import { DatePicker } from '@/components/ui/FormComponents'
import { format } from 'date-fns'

interface OnboardingTask {
  id: string
  title: string
  description?: string
  status?: string
  assigneeUserId?: string
  dueDate?: string
  completedAt?: string
}

export default function OnboardingEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const router = useRouter()
  const { isAuthenticated, refreshSession } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState<OnboardingTaskPayload>({ title: '', description: '', dueDate: '' })

  useEffect(() => {
    if (!employeeId) return
    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!isAuthenticated) {
          const ok = await refreshSession({ silent: true })
          if (!ok) {
            router.replace('/login')
            return
          }
        }
        await startOnboardingProcess(employeeId as string)
        const process = await getOnboardingProcess(employeeId as string)
        setTasks(process?.tasks ?? [])
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load onboarding')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [employeeId, isAuthenticated, refreshSession, router])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title) return
    setSaving(true)
    setError(null)
    try {
      const created = await createOnboardingTask(employeeId as string, newTask)
      setTasks((prev) => [...prev, created])
      setNewTask({ title: '', description: '', dueDate: '' })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await completeOnboardingTask(taskId)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to complete task')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading onboarding...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-red-600 text-sm font-medium">Error: {error}</p>
        <button
          className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
          onClick={() => router.refresh()}
          disabled={saving}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Onboarding</h1>
        <p className="text-sm text-gray-600">Employee ID: {employeeId}</p>
      </div>

      <form onSubmit={handleCreateTask} className="grid gap-3 max-w-lg bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium text-gray-900">Create Task</h2>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Title"
          value={newTask.title}
          onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
        <textarea
          className="border rounded px-3 py-2 text-sm"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
        />
        <DatePicker
          value={newTask.dueDate || ''}
          onChange={(date) => setNewTask((prev) => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add Task'}
        </button>
      </form>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
          <span className="text-sm text-gray-500">{tasks.length} item(s)</span>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks yet.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="border rounded p-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{task.title}</p>
                {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                <p className="text-xs text-gray-500">
                  Status: {task.status || 'todo'} {task.dueDate ? `· Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {task.completedAt ? (
                  <span className="text-xs text-green-600 font-semibold">Done</span>
                ) : (
                  <button
                    onClick={() => handleComplete(task.id)}
                    disabled={saving}
                    className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
