"use client"

import { FormEvent, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { DatePicker } from "@/components/ui/FormComponents"
import {
  OffboardingProcess,
  OffboardingTask,
  getOffboardingProcesses,
  initiateOffboarding,
  updateOffboardingTask,
} from "@/services/offboardingService"
import api from "@/lib/axios"

export interface EmployeeOption {
  id: string
  name: string
  email: string
}

const taskStatusOptions: OffboardingTask["status"][] = ["pending", "in_progress", "completed", "skipped"]

interface OffboardingAdminPageClientProps {
  initialProcesses: OffboardingProcess[]
  initialEmployees: EmployeeOption[]
  initialCanManage: boolean
}

export function OffboardingAdminPageClient({
  initialProcesses,
  initialEmployees,
  initialCanManage,
}: OffboardingAdminPageClientProps) {
  const { user, token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ employeeId: "", exitDate: "", reason: "", notes: "" })
  const [errors, setErrors] = useState<{ employeeId?: string; exitDate?: string }>({})

  const canManageFromStore = useMemo(() => user?.permissions?.includes("offboarding.manage") ?? false, [user?.permissions])
  const canManage = canManageFromStore || initialCanManage

  const processesQuery = useQuery<OffboardingProcess[]>({
    queryKey: ["offboarding", "processes"],
    queryFn: () => getOffboardingProcesses(),
    initialData: initialProcesses,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const employeesQuery = useQuery<EmployeeOption[]>({
    queryKey: ["offboarding", "employees"],
    queryFn: async () => {
      const response = await api.get("/employees", {
        params: { limit: 200 },
      })
      const payload = response.data?.data ?? response.data ?? []
      const employees = Array.isArray(payload?.employees) ? payload.employees : Array.isArray(payload) ? payload : []
      return employees.map((emp: any) => ({
        id: emp.id,
        name: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.email,
        email: emp.email,
      }))
    },
    initialData: initialEmployees,
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const processes = processesQuery.data ?? []
  const employees = employeesQuery.data ?? []
  const isLoading = processesQuery.isLoading

  const handleInitiate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: { employeeId?: string; exitDate?: string } = {}
    if (!form.employeeId) nextErrors.employeeId = "Employee is required"
    if (!form.exitDate) nextErrors.exitDate = "Exit date is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    try {
      await initiateOffboarding(form)
      showToast("Offboarding process started", "success")
      setForm({ employeeId: "", exitDate: "", reason: "", notes: "" })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ["offboarding", "processes"] })
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to initiate offboarding"
      showToast(message, "error")
    }
  }

  const handleTaskUpdate = async (taskId: string, status: OffboardingTask["status"]) => {
    try {
      await updateOffboardingTask(taskId, { status })
      queryClient.invalidateQueries({ queryKey: ["offboarding", "processes"] })
      showToast("Task updated", "success")
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to update task"
      showToast(message, "error")
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
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleInitiate} noValidate>
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <span>Employee</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.employeeId ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                      value={form.employeeId}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, employeeId: e.target.value }))
                        if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: undefined }))
                      }}
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} • {emp.email}
                        </option>
                      ))}
                    </select>
                    {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
                  </div>
                  <div>
                    <DatePicker
                      label="Exit Date"
                      required
                      value={form.exitDate}
                      onChange={(date) =>
                        setForm((prev) => ({
                          ...prev,
                          exitDate: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                      }
                      error={errors.exitDate}
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
                      disabled={processesQuery.isFetching}
                    >
                      {processesQuery.isFetching ? "Submitting..." : "Start Offboarding"}
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
                            Exit date {process.exitDate ? format(new Date(process.exitDate), "PP") : "—"} · {process.status}
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
                              <p className="text-xs text-gray-500">Assigned to {task.assigneeRole || "—"}</p>
                            </div>
                            {canManage ? (
                              <select
                                className="rounded border border-gray-300 px-3 py-2 text-sm"
                                value={task.status}
                                onChange={(e) => handleTaskUpdate(task.id, e.target.value as OffboardingTask["status"])}
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
                  )})}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
