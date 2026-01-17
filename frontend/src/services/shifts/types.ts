export interface Shift {
  id: string
  employeeId: string
  startTime: string
  endTime: string
  type: string
  location?: string
  status: string
  employee?: {
    firstName: string
    lastName: string
  }
}
