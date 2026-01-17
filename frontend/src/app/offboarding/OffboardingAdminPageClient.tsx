"use client"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { useOffboarding } from "@/hooks/useOffboarding"
import type { OffboardingProcess } from "@/services/offboarding/types"
import type { OffboardingEmployeeOption } from "@/services/offboarding/api"
import {
  OffboardingHeader,
  OffboardingInitiateForm,
  OffboardingProcessList,
} from "@/components/features/offboarding"

interface OffboardingAdminPageClientProps {
  initialProcesses: OffboardingProcess[]
  initialEmployees: OffboardingEmployeeOption[]
  initialCanManage: boolean
}

export function OffboardingAdminPageClient({
  initialProcesses,
  initialEmployees,
  initialCanManage,
}: OffboardingAdminPageClientProps) {
  const {
    canManage,
    form,
    setForm,
    errors,
    setErrors,
    processes,
    employees,
    isLoading,
    isSubmitting,
    handleInitiate,
    handleTaskUpdate,
  } = useOffboarding({
    initialProcesses,
    initialEmployees,
    initialCanManage,
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <OffboardingHeader totalProcesses={processes.length} />

            {canManage && (
              <OffboardingInitiateForm
                employees={employees}
                form={form}
                errors={errors}
                onFormChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                onErrorClear={(field) => setErrors((prev) => ({ ...prev, [field]: undefined }))}
                onSubmit={handleInitiate}
                disabled={isSubmitting}
              />
            )}

            <OffboardingProcessList
              processes={processes}
              canManage={canManage}
              isLoading={isLoading}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
