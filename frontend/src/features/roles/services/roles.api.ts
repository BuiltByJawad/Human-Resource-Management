import api from '@/lib/axios'
import type { Permission, Role, RolePermissionsResponse } from '@/features/roles/types/roles.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function fetchRoles(token?: string): Promise<Role[]> {
  const response = await api.get('/roles', withAuthConfig(token))
  const payload = response.data
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload

  const root = payload?.data ?? payload
  if (Array.isArray(root?.roles)) return root.roles
  if (Array.isArray(root?.data?.roles)) return root.data.roles
  if (Array.isArray(root?.data)) return root.data

  return []
}

export async function fetchRolePermissions(token?: string): Promise<RolePermissionsResponse> {
  try {
    const response = await api.get('/roles/permissions', withAuthConfig(token))
    const payload = response.data
    const permissions = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    const grouped = payload?.grouped ?? {}
    return { permissions: permissions as Permission[], grouped: grouped as Record<string, Permission[]> }
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401 || status === 404) {
      return { permissions: [], grouped: {} }
    }
    throw error
  }
}

export type UpsertRolePayload = Partial<Role> & { permissionIds?: string[] }

export async function createRole(payload: UpsertRolePayload, token?: string): Promise<Role> {
  const response = await api.post('/roles', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Role
}

export async function updateRole(
  roleId: string,
  payload: UpsertRolePayload,
  token?: string,
): Promise<Role> {
  const response = await api.put(`/roles/${roleId}`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Role
}

export async function deleteRoleById(roleId: string, token?: string): Promise<void> {
  await api.delete(`/roles/${roleId}`, withAuthConfig(token))
}
