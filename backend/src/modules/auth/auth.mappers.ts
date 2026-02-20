export interface AuthUserSource {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: { name: string }
  avatarUrl?: string | null
  employee?: unknown
}

export const mapAuthUser = (user: AuthUserSource) => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    avatarUrl: user.avatarUrl,
    employee: user.employee,
  }
}

export const flattenPermissions = (user: { role: { permissions: Array<{ permission: { resource: string; action: string } }> } }): string[] => {
  return user.role.permissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`)
}
