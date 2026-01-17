import type { Department, EmployeesPage, EmployeesQueryParams, Role, EmployeePayload } from './types'
import {
  fetchDepartments as fetchDepartmentsLegacy,
  fetchRolesWithToken as fetchRolesWithTokenLegacy,
  fetchEmployees as fetchEmployeesLegacy,
  createEmployee as createEmployeeLegacy,
  updateEmployee as updateEmployeeLegacy,
  deleteEmployeeById as deleteEmployeeByIdLegacy,
  sendEmployeeInvite as sendEmployeeInviteLegacy,
} from '@/lib/hrmData'

export const fetchDepartments = (token?: string) => fetchDepartmentsLegacy(token)

export const fetchRolesWithToken = (token?: string) => fetchRolesWithTokenLegacy(token)

export const fetchEmployees = (params: EmployeesQueryParams, token?: string) => fetchEmployeesLegacy(params, token)

export const createEmployee = (payload: EmployeePayload, token?: string) => createEmployeeLegacy(payload, token)

export const updateEmployee = (id: string, payload: Partial<EmployeePayload>, token?: string) =>
  updateEmployeeLegacy(id, payload, token)

export const deleteEmployeeById = (id: string, token?: string) => deleteEmployeeByIdLegacy(id, token)

export const sendEmployeeInvite = (
  payload: { email: string; roleId: string },
  token?: string
): Promise<void> => sendEmployeeInviteLegacy(payload, token)

export type {
  Department,
  EmployeesPage,
  EmployeesQueryParams,
  Role,
  EmployeePayload,
}
