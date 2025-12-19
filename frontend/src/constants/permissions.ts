export const PERMISSIONS = {
  UPDATE_OWN_PROFILE: 'auth.update_own_profile',
  CHANGE_OWN_PASSWORD: 'auth.change_own_password',
  UPDATE_OWN_NOTIFICATIONS: 'notifications.update_own_notifications',

  VIEW_EMPLOYEES: 'employees.view',
  MANAGE_EMPLOYEES: 'employees.manage',
  VIEW_EMPLOYEE_DETAILS: 'employees.view_details',

  MANAGE_ROLES: 'roles.manage',
  ASSIGN_ROLES: 'roles.assign',

  MANAGE_DEPARTMENTS: 'departments.manage',

  VIEW_ATTENDANCE: 'attendance.view',
  MANAGE_ATTENDANCE: 'attendance.manage',

  VIEW_LEAVE_REQUESTS: 'leave_requests.view',
  MANAGE_LEAVE_REQUESTS: 'leave_requests.manage',
  APPROVE_LEAVE: 'leave_requests.approve',
  MANAGE_LEAVE_POLICIES: 'leave_policies.manage',

  VIEW_PAYROLL: 'payroll.view',
  MANAGE_PAYROLL: 'payroll.manage',
  GENERATE_PAYROLL: 'payroll.generate',
  CONFIGURE_PAYROLL: 'payroll.configure',
  VIEW_BENEFITS: 'benefits.view',
  MANAGE_BENEFITS: 'benefits.manage',
  ENROLL_BENEFITS: 'benefits.enroll',
  VIEW_EXPENSES: 'expenses.view',
  MANAGE_EXPENSES: 'expenses.manage',
  APPROVE_EXPENSES: 'expenses.approve',
  VIEW_OFFBOARDING: 'offboarding.view',
  MANAGE_OFFBOARDING: 'offboarding.manage',

  VIEW_ASSETS: 'assets.view',
  MANAGE_ASSETS: 'assets.manage',
  ASSIGN_ASSETS: 'assets.assign',

  VIEW_COMPLIANCE: 'compliance.view',
  MANAGE_COMPLIANCE: 'compliance.manage',

  VIEW_REPORTS: 'reports.view',
  EXPORT_REPORTS: 'reports.export',
  CONFIGURE_REPORTS: 'reports.configure',

  VIEW_ANALYTICS: 'analytics.view',
  MANAGE_ANALYTICS: 'analytics.manage',

  MANAGE_NOTIFICATIONS: 'notifications.manage',
  MANAGE_NOTIFICATION_TEMPLATES: 'notifications.manage_templates',

  VIEW_PERFORMANCE: 'performance.view',
  MANAGE_PERFORMANCE_CYCLES: 'performance.manage_cycles',
  REVIEW_PERFORMANCE: 'performance.review',

  MANAGE_SYSTEM_SETTINGS: 'settings.manage_system_settings',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
