export interface DepartmentManagerSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface DepartmentParentSummary {
  id: string
  name: string
}

export interface DepartmentCounts {
  employees: number
  subDepartments: number
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  manager?: DepartmentManagerSummary
  parentDepartment?: DepartmentParentSummary
  _count?: DepartmentCounts
}

export type UpsertDepartmentPayload = Partial<Department>
