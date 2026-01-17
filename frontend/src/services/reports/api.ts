import {
  fetchReportsDashboard,
  fetchReportByType,
  downloadReportCsv,
  downloadReportPdf,
  fetchScheduledReportRecipients,
  fetchScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  runScheduledReportNow,
  setScheduledReportEnabled,
  deleteScheduledReport,
  type ReportsFilterParams,
  type ScheduledReport,
  type ScheduledReportFormat,
  type ScheduledReportFrequency,
  type ScheduledReportRecipientUser,
  type ScheduledReportType,
  type UpsertScheduledReportPayload,
} from '@/lib/hrmData'

export type {
  ReportsFilterParams,
  ScheduledReport,
  ScheduledReportFormat,
  ScheduledReportFrequency,
  ScheduledReportRecipientUser,
  ScheduledReportType,
  UpsertScheduledReportPayload,
}

export const getReportsDashboard = (token?: string) => fetchReportsDashboard(token)

export const getReportByType = (
  type: Exclude<ScheduledReportType, 'schedules'>,
  filters: ReportsFilterParams,
  token?: string,
) => fetchReportByType(type, filters, token)

export const downloadReportCsvApi = (
  type: Exclude<ScheduledReportType, 'schedules'>,
  filters: ReportsFilterParams,
  token?: string,
) => downloadReportCsv(type, filters, token)

export const downloadReportPdfApi = (
  type: Exclude<ScheduledReportType, 'schedules'>,
  filters: ReportsFilterParams,
  token?: string,
) => downloadReportPdf(type, filters, token)

export const getScheduledReportRecipients = (token?: string) => fetchScheduledReportRecipients(token)

export const getScheduledReports = (token?: string) => fetchScheduledReports(token)

export const createScheduledReportApi = (payload: UpsertScheduledReportPayload, token?: string) =>
  createScheduledReport(payload, token)

export const updateScheduledReportApi = (id: string, payload: UpsertScheduledReportPayload, token?: string) =>
  updateScheduledReport(id, payload, token)

export const runScheduledReportNowApi = (id: string, token?: string) => runScheduledReportNow(id, token)

export const setScheduledReportEnabledApi = (id: string, isEnabled: boolean, token?: string) =>
  setScheduledReportEnabled(id, isEnabled, token)

export const deleteScheduledReportApi = (id: string, token?: string) => deleteScheduledReport(id, token)
