import { downloadPayslipPdf as downloadPayslipPdfLegacy, downloadPayslipsCsv as downloadPayslipsCsvLegacy } from '@/lib/hrmData'

export const downloadPayslipPdf = (payrollRecordId: string, token?: string) =>
  downloadPayslipPdfLegacy(payrollRecordId, token)

export const downloadPayslipsCsv = (employeeId?: string, token?: string) => downloadPayslipsCsvLegacy(employeeId, token)
