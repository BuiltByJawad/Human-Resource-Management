"use client"

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
    <div className="p-4 md:p-6">
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
    </div>
  )
}
