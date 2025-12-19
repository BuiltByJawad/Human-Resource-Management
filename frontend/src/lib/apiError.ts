export interface ApiErrorInfo {
  status?: number
  message: string
  fieldErrors: Record<string, string>
  isAuthError: boolean
  isConflict: boolean
  raw?: unknown
}

const DEFAULT_ERROR_MESSAGE = 'Operation failed'

export function parseApiError(error: any, fallbackMessage = DEFAULT_ERROR_MESSAGE): ApiErrorInfo {
  const status = error?.response?.status
  const data = error?.response?.data
  const rawMessage =
    data?.message ??
    data?.error?.message ??
    data?.error ??
    error?.message ??
    fallbackMessage

  const message = typeof rawMessage === 'string'
    ? rawMessage
    : rawMessage?.message ?? fallbackMessage

  const fieldErrors = (data?.errors as Record<string, string>) ?? {}
  const normalizedMessage = message?.toLowerCase?.() ?? ''

  return {
    status,
    message,
    fieldErrors,
    isAuthError: status === 401 || status === 403,
    isConflict: status === 409 || normalizedMessage.includes('already exists'),
    raw: data
  }
}

export type SetFieldError = (field: string, message: string) => void

interface CrudErrorOptions {
  error: any
  resourceLabel: string
  showToast: (title: string, type?: 'success' | 'error' | 'info' | 'warning', description?: string) => void
  setFieldError?: SetFieldError
  defaultField?: string
  onUnauthorized?: () => void
  onUnhandled?: (info: ApiErrorInfo) => void
}

export function handleCrudError({
  error,
  resourceLabel,
  showToast,
  setFieldError,
  defaultField = 'name',
  onUnauthorized,
  onUnhandled,
}: CrudErrorOptions) {
  const info = parseApiError(error, `${resourceLabel} action failed`)

  if (info.isConflict && setFieldError) {
    const field = Object.keys(info.fieldErrors)[0] ?? defaultField
    const fieldMessage = info.fieldErrors[field] ?? info.message
    setFieldError(field, fieldMessage)
    showToast(`${resourceLabel} conflict`, 'error', fieldMessage)
    return
  }

  if (info.isAuthError) {
    onUnauthorized?.()
    showToast('Not authorized', 'error', `You cannot modify ${resourceLabel.toLowerCase()}.`)
    return
  }

  if (setFieldError && Object.keys(info.fieldErrors).length > 0) {
    Object.entries(info.fieldErrors).forEach(([field, message]) => {
      setFieldError(field, message)
    })
  }

  onUnhandled?.(info)
  showToast(info.message || `${resourceLabel} action failed`, 'error')
}
