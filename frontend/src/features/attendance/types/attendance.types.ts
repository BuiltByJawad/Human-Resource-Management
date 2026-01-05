export interface AttendanceRecord {
  id: string
  checkIn: string
  checkOut?: string
  status: 'present' | 'absent' | 'late' | 'half_day'
  workHours?: number
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface ClockInPayload {
  latitude: number
  longitude: number
}

export interface ClockOutPayload {
  attendanceId?: string
  latitude?: number
  longitude?: number
}
