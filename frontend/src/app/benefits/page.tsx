"use client"

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components/ui/ToastProvider'
import {
  type BenefitPlan,
  createBenefitPlan,
  enrollEmployeeInBenefit,
  getBenefitPlans,
} from '@/features/benefits'
import { fetchEmployeesForManagers } from '@/features/employees'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/FormComponents'

interface EmployeeOption {
  id: string
  name: string
  email: string
}

const planTypes = ['Health', 'Dental', 'Vision', 'Retirement', 'Other']

export default function BenefitsAdminPage() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [plans, setPlans] = useState<BenefitPlan[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshToggle, setRefreshToggle] = useState(false)

  const [planForm, setPlanForm] = useState({
    name: '',
    type: 'Health',
    description: '',
    provider: '',
    costToEmployee: 0,
    costToCompany: 0
  })

  const [enrollForm, setEnrollForm] = useState({
    employeeId: '',
    benefitPlanId: '',
    coverageStartDate: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      try {
        const [plansResp, employeesResp] = await Promise.all([
          getBenefitPlans(token ?? undefined),
          fetchEmployeesForManagers(token ?? undefined),
        ])
        setPlans(plansResp || [])
        setEmployees(
          (employeesResp || []).map((emp: any) => ({
            id: emp.id,
            name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email,
            email: emp.email
          }))
        )
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
        }
        showToast('Failed to load benefits data', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, refreshToggle, showToast])

  const totalCompanyCost = useMemo(
    () => plans.reduce((acc, plan) => acc + Number(plan.costToCompany || 0), 0),
    [plans]
  )

  const totalEmployeeCost = useMemo(
    () => plans.reduce((acc, plan) => acc + Number(plan.costToEmployee || 0), 0),
    [plans]
  )

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBenefitPlan(planForm)
      showToast('Benefit plan created', 'success')
      setPlanForm({ name: '', type: 'Health', description: '', provider: '', costToEmployee: 0, costToCompany: 0 })
      setRefreshToggle((prev) => !prev)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create plan'
      showToast(message, 'error')
    }
  }

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await enrollEmployeeInBenefit({
        ...enrollForm,
        coverageStartDate: enrollForm.coverageStartDate
      })
      showToast('Employee enrolled successfully', 'success')
      setEnrollForm((prev) => ({ ...prev, benefitPlanId: '' }))
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to enroll employee'
      showToast(message, 'error')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Benefits Management</h1>
                <p className="text-sm text-gray-600">Create company benefit plans and manage employee enrollments.</p>
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Create Benefit Plan</h2>
                <form className="space-y-4" onSubmit={handlePlanSubmit}>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <input
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={planForm.name}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <select
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={planForm.type}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      {planTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cost to Employee</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={planForm.costToEmployee}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, costToEmployee: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cost to Company</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={planForm.costToCompany}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, costToCompany: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Provider</label>
                    <input
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={planForm.provider}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, provider: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={3}
                      value={planForm.description}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Create Plan
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Enroll Employee</h2>
                <form className="space-y-4" onSubmit={handleEnrollSubmit}>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Employee</label>
                    <select
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={enrollForm.employeeId}
                      onChange={(e) => setEnrollForm((prev) => ({ ...prev, employeeId: e.target.value }))}
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
                    <label className="text-sm font-medium text-gray-700">Benefit Plan</label>
                    <select
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={enrollForm.benefitPlanId}
                      onChange={(e) => setEnrollForm((prev) => ({ ...prev, benefitPlanId: e.target.value }))}
                      required
                    >
                      <option value="">Select plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Coverage Start Date</label>
                    <DatePicker
                      value={enrollForm.coverageStartDate}
                      onChange={(date) =>
                        setEnrollForm((prev) => ({
                          ...prev,
                          coverageStartDate: date ? format(date, 'yyyy-MM-dd') : ''
                        }))
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700"
                    disabled={!employees.length || !plans.length}
                  >
                    Enroll Employee
                  </button>
                </form>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow border border-gray-100 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Benefit Plans</h2>
                  <p className="text-sm text-gray-600">{plans.length} plans created</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Company Cost</p>
                    <p className="text-lg font-semibold text-gray-900">${totalCompanyCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Employee Cost</p>
                    <p className="text-lg font-semibold text-gray-900">${totalEmployeeCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Loading plans...</p>
              ) : plans.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border rounded-lg border-dashed">
                  No benefit plans yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{plan.name}</p>
                          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{plan.type}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          ${Number(plan.costToEmployee).toFixed(2)} / employee
                        </p>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <p className="text-gray-500 text-xs">Employee Cost</p>
                          <p className="font-semibold text-gray-900">
                            ${Number(plan.costToEmployee).toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <p className="text-gray-500 text-xs">Company Cost</p>
                          <p className="font-semibold text-gray-900">
                            ${Number(plan.costToCompany).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Created {plan.createdAt ? format(new Date(plan.createdAt), 'PP') : '—'}
                      </p>
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
