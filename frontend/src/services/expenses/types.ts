export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed'

export interface ExpenseClaim {
  id: string
  employeeId: string
  amount: number
  currency: string
  category: string
  date: string
  description?: string
  receiptUrl?: string
  status: ExpenseStatus
  rejectionReason?: string | null
  approvedBy?: string | null
}

export interface SubmitExpenseClaimPayload {
  employeeId: string
  amount: number
  currency?: string
  category: string
  date: string
  description?: string
  receiptUrl?: string
}

export interface UpdateExpenseStatusPayload {
  status: ExpenseStatus
  rejectionReason?: string
}
