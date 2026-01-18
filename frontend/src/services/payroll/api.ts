import {
  deletePayrollOverride as deletePayrollOverrideLegacy,
  downloadPayrollPeriodCsv as downloadPayrollPeriodCsvLegacy,
  downloadPayslipPdf as downloadPayslipPdfLegacy,
  downloadPayslipsCsv as downloadPayslipsCsvLegacy,
  fetchPayrollConfig as fetchPayrollConfigLegacy,
  fetchPayrollOverride as fetchPayrollOverrideLegacy,
  fetchPayrollRecords as fetchPayrollRecordsLegacy,
  generatePayroll as generatePayrollLegacy,
  updatePayrollConfig as updatePayrollConfigLegacy,
  updatePayrollStatus as updatePayrollStatusLegacy,
  upsertPayrollOverride as upsertPayrollOverrideLegacy,
} from '@/lib/hrmData'
import type { PayrollConfig, PayrollRecord, PayrollStatus } from '@/services/payroll/types'

export const fetchPayrollRecords = (token?: string): Promise<PayrollRecord[]> => fetchPayrollRecordsLegacy(token)

export const generatePayroll = (payPeriod: string, token?: string) => generatePayrollLegacy(payPeriod, token)

export const updatePayrollStatus = (
  payrollId: string,
  status: PayrollStatus,
  tokenOrMeta?: string | { paidAt?: string; paymentMethod?: string; paymentReference?: string },
  tokenMaybe?: string
) => updatePayrollStatusLegacy(payrollId, status, tokenOrMeta as never, tokenMaybe)

export const downloadPayrollPeriodCsv = (payPeriod: string, token?: string) =>
  downloadPayrollPeriodCsvLegacy(payPeriod, token)

export const downloadPayslipPdf = (payrollRecordId: string, token?: string) =>
  downloadPayslipPdfLegacy(payrollRecordId, token)

export const downloadPayslipsCsv = (employeeId?: string, token?: string) => downloadPayslipsCsvLegacy(employeeId, token)

export const fetchPayrollConfig = (token?: string): Promise<PayrollConfig> => fetchPayrollConfigLegacy(token)

export const updatePayrollConfig = (config: PayrollConfig, token?: string): Promise<PayrollConfig> =>
  updatePayrollConfigLegacy(config, token)

export const fetchPayrollOverride = (
  employeeId: string,
  payPeriod: string,
  token?: string
): Promise<PayrollConfig | null> => fetchPayrollOverrideLegacy(employeeId, payPeriod, token)

export const upsertPayrollOverride = (
  employeeId: string,
  payPeriod: string,
  config: PayrollConfig,
  token?: string
): Promise<PayrollConfig> => upsertPayrollOverrideLegacy(employeeId, payPeriod, config, token)

export const deletePayrollOverride = (employeeId: string, payPeriod: string, token?: string): Promise<boolean> =>
  deletePayrollOverrideLegacy(employeeId, payPeriod, token)
