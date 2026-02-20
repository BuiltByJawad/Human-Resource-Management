"use client"

import { useParams, useRouter } from 'next/navigation'
 
import { useEmployeeOnboarding } from '@/hooks/useEmployeeOnboarding'
import { OnboardingHeader, OnboardingTaskForm, OnboardingTaskList } from '@/components/features/onboarding'

export default function OnboardingEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const router = useRouter()
  const {
    employee,
    tasks,
    isLoading,
    newTask,
    setNewTask,
    createTaskMutation,
    completeTaskMutation,
  } = useEmployeeOnboarding({ employeeId })

  const completedCount = tasks.filter((task) => Boolean(task.completedAt)).length

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white p-4 md:p-6 space-y-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="space-y-10">
          <OnboardingHeader
            employee={employee}
            isLoading={isLoading}
            onBack={() => router.back()}
            totalTasks={tasks.length}
            completedTasks={completedCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Create Task */}
            <div className="lg:col-span-1">
              <OnboardingTaskForm
                newTask={newTask}
                onChange={setNewTask}
                onSubmit={() => createTaskMutation.mutate(newTask)}
                isSubmitting={createTaskMutation.isPending}
              />
            </div>

            {/* Right Column: Task List */}
            <div className="lg:col-span-2 space-y-4">
              <OnboardingTaskList
                tasks={tasks}
                isLoading={isLoading}
                isCompleting={completeTaskMutation.isPending}
                onComplete={(taskId) => completeTaskMutation.mutate(taskId)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
