import Joi from 'joi'

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
})

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
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
  password: Joi.string().required(),
})

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required(),
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
  leaveType: Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'paternity').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  reason: Joi.string().max(500).optional(),
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

export const orgSettingsSchema = Joi.object({
  siteName: Joi.string().max(100).allow('', null),
  tagline: Joi.string().max(150).allow('', null),
  companyName: Joi.string().max(150).allow('', null),
  companyAddress: Joi.string().max(300).allow('', null),
})