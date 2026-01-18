"use client"

import { useParams, useRouter } from 'next/navigation'
 
import DashboardShell from '@/components/ui/DashboardShell'
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

  return (
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-8">

            <OnboardingHeader employee={employee} isLoading={isLoading} onBack={() => router.back()} />

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
    </DashboardShell>
  )
}
