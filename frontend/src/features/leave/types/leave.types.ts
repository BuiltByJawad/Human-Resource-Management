export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveEmployeeSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface LeaveApproverSummary {
  firstName: string
  lastName: string
}

export interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  employee: LeaveEmployeeSummary
  approver?: LeaveApproverSummary
}

export interface LeaveFilterParams {
  status?: string
}

export interface CreateLeavePayload {
  leaveType: string
  startDate: string
  endDate: string
  reason: string
}
