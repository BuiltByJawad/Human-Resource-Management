export type AssetStatus = 'available' | 'assigned' | 'maintenance' | 'retired'

export interface AssetAssignment {
  id: string
  assetId: string
  employeeId: string
  assignedDate: string
  returnedDate?: string | null
  notes?: string
  employee: {
    id: string
    firstName: string
    lastName: string
    employeeNumber: string
  }
}

export interface MaintenanceLog {
  id: string
  assetId: string
  description: string
  cost?: number
  date: string
  performedBy?: string
}

export interface Asset {
  id: string
  name: string
  serialNumber: string
  type: string
  status: AssetStatus
  purchaseDate: string
  purchasePrice?: number
  vendor?: string
  description?: string
  assignments: AssetAssignment[]
  maintenance?: MaintenanceLog[]
}

export interface AssetsFilterParams {
  status?: string
  search?: string
}

export interface UpsertAssetPayload {
  name: string
  serialNumber: string
  type: string
  purchaseDate: string
  purchasePrice?: number | null
  vendor?: string
  description?: string
}

export interface AssignAssetPayload {
  employeeId: string
  notes?: string
}
