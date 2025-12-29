"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  RocketLaunchIcon,
  PlusIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, DatePicker } from '@/components/ui/FormComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import api from '@/lib/axios'
import DashboardShell from '@/components/ui/DashboardShell'
import {
  startOnboardingProcess,
  getOnboardingProcess,
  createOnboardingTask,
  completeOnboardingTask,
  OnboardingTaskPayload
} from '@/services/onboardingService'

export default function OnboardingEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const router = useRouter()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [newTask, setNewTask] = useState<OnboardingTaskPayload>({
    title: '',
    description: '',
    dueDate: ''
  })

  // Fetch Employee Details for context
  const employeeQuery = useQuery({
    queryKey: ['employee', employeeId, token],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`)
      return res.data.data || res.data
    },
    enabled: !!employeeId && !!token,
  })

  // Fetch Onboarding Process
  const onboardingQuery = useQuery({
    queryKey: ['onboarding-process', employeeId, token],
    queryFn: async () => {
      await startOnboardingProcess(employeeId as string)
      return await getOnboardingProcess(employeeId as string)
    },
    enabled: !!employeeId && !!token,
  })

  const createTaskMutation = useMutation({
    mutationFn: (data: OnboardingTaskPayload) => createOnboardingTask(employeeId as string, data),
    onSuccess: () => {
      showToast('Task added successfully', 'success')
      setNewTask({ title: '', description: '', dueDate: '' })
      queryClient.invalidateQueries({ queryKey: ['onboarding-process', employeeId] })
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create task', 'error')
    }
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => completeOnboardingTask(taskId),
    onSuccess: () => {
      showToast('Task marked as complete', 'success')
      queryClient.invalidateQueries({ queryKey: ['onboarding-process', employeeId] })
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to complete task', 'error')
    }
  })

  const employee = employeeQuery.data
  const tasks = onboardingQuery.data?.tasks || []
  const isLoading = employeeQuery.isLoading || onboardingQuery.isLoading

  return (
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-8">

            {/* Page Title & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => router.back()}
                  className="mt-1 p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
                  aria-label="Go back"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                    Onboarding Workflow
                  </h1>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="h-4 w-4" />
                    {isLoading ? (
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <span>
                        Managing onboarding for <span className="font-semibold text-gray-900">{employee?.firstName} {employee?.lastName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Create Task */}
              <div className="lg:col-span-1">
                <Card className="sticky top-0 shadow-sm border-gray-200/60">
                  <CardHeader>
                    <CardTitle className="text-lg">New Step</CardTitle>
                    <CardDescription>Add a requirement for this employee's onboarding.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        createTaskMutation.mutate(newTask)
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step Title</label>
                        <input
                          className="w-full border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g. System Access Setup"
                          value={newTask.title}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                        <textarea
                          className="w-full border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[100px]"
                          placeholder="What needs to be done?"
                          value={newTask.description}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Date</label>
                        <DatePicker
                          value={newTask.dueDate || ''}
                          onChange={(date) => setNewTask((prev) => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={createTaskMutation.isPending}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {createTaskMutation.isPending ? 'Saving...' : 'Add Step'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Task List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-400" />
                    Checklist
                  </h2>
                  <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl"></div>
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <RocketLaunchIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No steps defined yet</h3>
                    <p className="text-gray-500 mt-1 max-w-xs mx-auto">Start building the onboarding journey for this employee.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task: any) => (
                      <Card key={task.id} className={`group border-gray-200/60 hover:border-blue-200 hover:shadow-md transition-all duration-200 ${task.completedAt ? 'bg-gray-50/50 opacity-75' : 'bg-white'}`}>
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {task.completedAt && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
                              <p className={`font-bold text-lg leading-tight ${task.completedAt ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </p>
                            </div>
                            {task.description && (
                              <p className={`text-sm ${task.completedAt ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                                {task.description}
                              </p>
                            )}
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                              {task.dueDate && (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md ${task.completedAt ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'}`}>
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${task.completedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {task.completedAt ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>

                          {!task.completedAt && (
                            <Button
                              onClick={() => completeTaskMutation.mutate(task.id)}
                              disabled={completeTaskMutation.isPending}
                              variant="outline"
                              className="shrink-0 border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 font-bold active:scale-95 transition-all"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
