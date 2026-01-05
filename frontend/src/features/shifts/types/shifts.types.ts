export interface ShiftEmployeeSummary {
  firstName: string
  lastName: string
}

export interface Shift {
  id: string
  employeeId: string
  startTime: string
  endTime: string
  type: string
  location?: string
  status: string
  employee?: ShiftEmployeeSummary
}

export interface ScheduleShiftPayload {
  employeeId: string
  startTime: string
  endTime: string
  type: string
  location?: string
}
