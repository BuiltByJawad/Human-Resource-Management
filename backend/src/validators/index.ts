import Joi from 'joi'

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  rememberMe: Joi.boolean().optional(),
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