import Joi from 'joi'

const passwordSchema = Joi.string()
  .min(12)
  .custom((value, helpers) => {
    if (typeof value !== 'string') {
      return helpers.error('any.invalid')
    }

    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = /[^A-Za-z0-9]/.test(value)
    const categories = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length

    if (categories < 3) {
      return helpers.error('string.pattern.base')
    }

    return value
  }, 'password complexity')

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
})

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema.required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
})

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phoneNumber: Joi.string().max(30).allow('', null),
  address: Joi.string().max(300).allow('', null),
  dateOfBirth: Joi.date().less('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  maritalStatus: Joi.string().valid('single', 'married', 'divorced').optional(),
  emergencyContact: Joi.object({
    name: Joi.string().max(100).allow('', null),
    relationship: Joi.string().max(100).allow('', null),
    phone: Joi.string().max(30).allow('', null),
  }).optional(),
})

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  roleId: Joi.string().uuid().required(),
  expiresInHours: Joi.number().integer().min(1).max(168).optional(),
})

export const completeInviteSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema.required(),
})

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema.required(),
})

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

export const employeeSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  departmentId: Joi.string().uuid().required(),
  roleId: Joi.string().uuid().required(),
  managerId: Joi.string().uuid().optional(),
  hireDate: Joi.date().max('now').required(),
  salary: Joi.number().positive().min(1000).max(999999).required(),
  status: Joi.string().valid('active', 'inactive', 'terminated').optional(),
})

export const employeeUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  departmentId: Joi.string().uuid().optional(),
  roleId: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated').optional(),
  salary: Joi.number().positive().min(1000).max(999999).optional(),
})

export const leaveRequestSchema = Joi.object({
  leaveType: Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  reason: Joi.string().max(500).optional(),
  emergencyContact: Joi.string().max(300).optional(),
})

export const attendanceSchema = Joi.object({
  checkIn: Joi.date().required(),
  checkOut: Joi.date().greater(Joi.ref('checkIn')).optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').optional(),
})

export const departmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  managerId: Joi.string().uuid().optional(),
  parentDepartmentId: Joi.string().uuid().optional(),
})

export const roleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).optional(),
  permissions: Joi.object().required(),
})

export const settingsSchema = Joi.object({
  siteName: Joi.string().max(100).allow('', null),
  tagline: Joi.string().max(150).allow('', null),
  companyName: Joi.string().max(150).allow('', null),
  companyAddress: Joi.string().max(300).allow('', null),
  footerYear: Joi.number().integer().min(1970).max(9999).allow(null),
  privacyPolicyText: Joi.string().allow('', null),
  termsOfServiceText: Joi.string().allow('', null),

  loginHeroTitle: Joi.string().max(120).allow('', null),
  loginHeroSubtitle: Joi.string().max(200).allow('', null),
  loginAccentColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .allow('', null),
  loginBackgroundImage: Joi.string().uri().allow('', null),
  loginHighlights: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().max(80).allow('', null),
        description: Joi.string().max(240).allow('', null),
      })
    )
    .max(4)
    .optional(),
})

export const payrollConfigSchema = Joi.object({
  allowances: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(120).required(),
        type: Joi.string().valid('fixed', 'percentage').required(),
        value: Joi.number().min(0).required(),
      })
    )
    .max(50)
    .default([]),
  deductions: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(120).required(),
        type: Joi.string().valid('fixed', 'percentage').required(),
        value: Joi.number().min(0).required(),
      })
    )
    .max(50)
    .default([]),
})