"use client"

import type { Department } from '@/types/hrm'

interface DepartmentStatsProps {
  departments: Department[]
}

export function DepartmentStats({ departments }: DepartmentStatsProps) {
  const totalDepartments = departments.length
  const totalEmployees = departments.reduce((sum, dept) => sum + (dept._count?.employees ?? 0), 0)
  const totalSubDepartments = departments.reduce((sum, dept) => sum + (dept._count?.subDepartments ?? 0), 0)

  const stats = [
    { label: 'Departments', value: totalDepartments },
    { label: 'Employees', value: totalEmployees },
    { label: 'Sub-departments', value: totalSubDepartments },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
