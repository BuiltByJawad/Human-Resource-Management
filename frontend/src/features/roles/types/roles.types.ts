export interface Permission {
  id: string
  resource: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  permissions: { permission: Permission }[]
  _count?: {
    users: number
  }
}

export interface RolePermissionsResponse {
  permissions: Permission[]
  grouped: Record<string, Permission[]>
}
