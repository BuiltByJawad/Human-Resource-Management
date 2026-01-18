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

export interface ShiftEmployee {
  id: string
  firstName: string
  lastName: string
}

export type ShiftType = 'Regular' | 'Overtime' | 'OnCall'

export interface ShiftFormState {
  employeeId: string
  startTime: string
  endTime: string
  type: ShiftType
  location: string
}
