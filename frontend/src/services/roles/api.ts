import type { Role, Permission } from '@/types/hrm'
import { fetchRolesWithToken, fetchRolePermissions, createRole, updateRole, deleteRoleById } from '@/lib/hrmData'

export { Role, Permission }

export const getRoles = (token?: string) => fetchRolesWithToken(token)

export const getPermissions = (token?: string) => fetchRolePermissions(token)

export const createRoleApi = (payload: Partial<Role> & { permissionIds?: string[] }, token?: string) =>
  createRole(payload, token)

export const updateRoleApi = (roleId: string, payload: Partial<Role> & { permissionIds?: string[] }, token?: string) =>
  updateRole(roleId, payload, token)

export const deleteRoleApi = (roleId: string, token?: string) => deleteRoleById(roleId, token)
