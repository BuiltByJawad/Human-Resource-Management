import { PERMISSIONS } from '@/constants/permissions'
import { NotificationCategory, NotificationItem, NotificationSeverity, RawNotification } from '@/services/notifications/types'

const CATEGORY_RULES: Array<{
  category: NotificationCategory
  label: string
  colorClass: string
  keywords: RegExp
  permission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
}> = [
  {
    category: 'payroll',
    label: 'Payroll',
    colorClass: 'bg-emerald-100 text-emerald-700',
    keywords: /\b(payroll|salary|compensation|payout)\b/i,
    permission: PERMISSIONS.MANAGE_PAYROLL,
  },
  {
    category: 'leave',
    label: 'Leave',
    colorClass: 'bg-blue-100 text-blue-700',
    keywords: /\b(leave|vacation|time off|pto)\b/i,
    permission: PERMISSIONS.APPROVE_LEAVE,
  },
  {
    category: 'compliance',
    label: 'Compliance',
    colorClass: 'bg-amber-100 text-amber-700',
    keywords: /\b(compliance|audit|policy|violation)\b/i,
    permission: PERMISSIONS.MANAGE_COMPLIANCE,
  },
  {
    category: 'recruitment',
    label: 'Recruitment',
    colorClass: 'bg-purple-100 text-purple-700',
    keywords: /\b(recruitment|candidate|applicant|interview)\b/i,
    permission: PERMISSIONS.MANAGE_RECRUITMENT,
  },
  {
    category: 'expense',
    label: 'Expenses',
    colorClass: 'bg-rose-100 text-rose-700',
    keywords: /\b(expense|reimbursement|claim)\b/i,
    permission: PERMISSIONS.APPROVE_EXPENSES,
  },
  {
    category: 'performance',
    label: 'Performance',
    colorClass: 'bg-indigo-100 text-indigo-700',
    keywords: /\b(performance|review|feedback|evaluation)\b/i,
    permission: PERMISSIONS.MANAGE_PERFORMANCE_CYCLES,
  },
]

export const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
}

export function deriveCategoryMeta(notification: RawNotification) {
  const haystack = `${notification?.title ?? ''} ${notification?.message ?? ''}`.trim()
  const match = CATEGORY_RULES.find((rule) => rule.keywords.test(haystack))
  if (match) {
    return {
      category: match.category,
      categoryLabel: match.label,
      categoryColorClass: match.colorClass,
      requiresPermission: match.permission,
    }
  }

  return {
    category: 'general' as const,
    categoryLabel: 'General',
    categoryColorClass: 'bg-slate-100 text-slate-600',
    requiresPermission: undefined,
  }
}

export function deriveSeverity(text: string): NotificationSeverity {
  const normalized = text.toLowerCase()
  if (/\b(urgent|failed|past due|overdue|breach|violation)\b/.test(normalized)) {
    return 'high'
  }
  if (/\b(pending|requires action|awaiting|due soon|reminder)\b/.test(normalized)) {
    return 'medium'
  }
  return 'low'
}

export function mapNotificationPayload(raw: RawNotification): NotificationItem {
  const meta = deriveCategoryMeta(raw)
  const combinedText = `${raw?.title ?? ''} ${raw?.message ?? ''}`
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? 'Notification',
    message: raw.message ?? '',
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleString() : 'Just now',
    read: Boolean(raw.readAt) || raw.read === true || raw.isRead === true,
    link: raw.link,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    categoryColorClass: meta.categoryColorClass,
    severity: deriveSeverity(combinedText),
    requiresPermission: meta.requiresPermission,
  }
}
