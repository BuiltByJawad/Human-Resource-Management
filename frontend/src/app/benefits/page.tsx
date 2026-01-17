"use client"

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin'
import {
  BenefitsHeader,
  BenefitsSummaryCards,
  BenefitPlanForm,
  BenefitEnrollmentForm,
  BenefitPlansList,
} from '@/components/features/benefits'

export default function BenefitsAdminPage() {
  const {
    plans,
    employees,
    planForm,
    setPlanForm,
    enrollForm,
    setEnrollForm,
    totalCompanyCost,
    totalEmployeeCost,
    handlePlanSubmit,
    handleEnrollSubmit,
    isSubmitting,
    loading,
  } = useBenefitsAdmin({})

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <BenefitsHeader
              title="Benefits Management"
              subtitle="Create company benefit plans and manage employee enrollments."
            />

            <BenefitsSummaryCards
              totalCompanyCost={totalCompanyCost}
              totalEmployeeCost={totalEmployeeCost}
            />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BenefitPlanForm
                values={planForm}
                onChange={setPlanForm}
                onSubmit={handlePlanSubmit}
                disabled={isSubmitting}
              />
              <BenefitEnrollmentForm
                employees={employees}
                plans={plans}
                values={enrollForm}
                onChange={setEnrollForm}
                onSubmit={handleEnrollSubmit}
                disabled={isSubmitting}
              />
            </section>

            <BenefitPlansList
              plans={plans}
              isLoading={loading}
              totalCompanyCost={totalCompanyCost}
              totalEmployeeCost={totalEmployeeCost}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
