export interface PayrollRecord {
  id: string
  payPeriod: string
  netSalary: number
  baseSalary?: number
  allowances?: number
  allowancesBreakdown?: { name: string; amount: number }[]
  deductions?: number
  deductionsBreakdown?: { name: string; amount: number }[]
  status: "draft" | "processed" | "paid" | "error"
  employee: {
    firstName: string
    lastName: string
    employeeNumber: string
    department?: { name: string }
  }
}
