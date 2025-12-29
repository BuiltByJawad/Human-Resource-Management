import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ Clearing database...')

  // Disable foreign key checks for truncation (PostgreSQL specific)
  // Note: TRUNCATE CASCADE is easier but we want to be explicit
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    console.log('✅ Database cleared')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    // Fallback if TRUNCATE CASCADE fails for some tables
  }

  console.log('🌱 Starting seeding...')

  // 0. Create Demo Organization
  const demoOrg = await prisma.organization.create({
    data: {
      name: 'NovaHR Demo Corp',
      slug: 'novahr',
    },
  })

  await prisma.companySettings.create({
    data: {
      organizationId: demoOrg.id,
      siteName: 'NovaHR Workspace',
      tagline: 'Empowering Humans',
      companyName: 'NovaHR Global Solutions',
    },
  })

  // 1. Create Comprehensive Permissions based on PERMISSIONS constant
  const permissions = [
    // Auth & Profile
    { resource: 'auth', action: 'update_own_profile', description: 'Update own profile' },
    { resource: 'auth', action: 'change_own_password', description: 'Change own password' },

    // Notifications
    { resource: 'notifications', action: 'update_own_notifications', description: 'Update own notification preferences' },
    { resource: 'notifications', action: 'manage', description: 'Manage organization notifications' },
    { resource: 'notifications', action: 'manage_templates', description: 'Manage notification templates' },

    // Core HR
    { resource: 'employees', action: 'view', description: 'View employees' },
    { resource: 'employees', action: 'manage', description: 'Create or edit employees' },
    { resource: 'employees', action: 'view_details', description: 'View detailed employee info (salary, etc)' },
    { resource: 'roles', action: 'manage', description: 'Manage roles' },
    { resource: 'roles', action: 'assign', description: 'Assign roles to users' },
    { resource: 'departments', action: 'manage', description: 'Manage departments' },

    // Operations
    { resource: 'attendance', action: 'view', description: 'View attendance' },
    { resource: 'attendance', action: 'manage', description: 'Manage attendance' },
    { resource: 'leave_requests', action: 'view', description: 'View leave requests' },
    { resource: 'leave_requests', action: 'manage', description: 'Manage leave requests' },
    { resource: 'leave_requests', action: 'approve', description: 'Approve leave requests' },
    { resource: 'leave_policies', action: 'manage', description: 'Manage leave policies' },
    { resource: 'payroll', action: 'view', description: 'View payroll' },
    { resource: 'payroll', action: 'manage', description: 'Manage payroll' },
    { resource: 'payroll', action: 'generate', description: 'Generate payroll' },
    { resource: 'payroll', action: 'configure', description: 'Configure payroll settings' },
    { resource: 'benefits', action: 'view', description: 'View benefit plans' },
    { resource: 'benefits', action: 'manage', description: 'Manage benefit plans' },
    { resource: 'benefits', action: 'enroll', description: 'Enroll employees in benefits' },
    { resource: 'expenses', action: 'view', description: 'View expense claims' },
    { resource: 'expenses', action: 'manage', description: 'Submit/edit expense claims' },
    { resource: 'expenses', action: 'approve', description: 'Approve expense claims' },

    // Lifecycle
    { resource: 'onboarding', action: 'view', description: 'View onboarding' },
    { resource: 'onboarding', action: 'manage', description: 'Manage onboarding' },
    { resource: 'offboarding', action: 'view', description: 'View offboarding' },
    { resource: 'offboarding', action: 'manage', description: 'Manage offboarding' },

    // System & Assets
    { resource: 'assets', action: 'view', description: 'View assets' },
    { resource: 'assets', action: 'manage', description: 'Manage assets' },
    { resource: 'assets', action: 'assign', description: 'Assign assets' },
    { resource: 'compliance', action: 'view', description: 'View compliance' },
    { resource: 'compliance', action: 'manage', description: 'Manage compliance' },
    { resource: 'settings', action: 'manage_system_settings', description: 'Manage system settings' },

    // Analytics & Reporting
    { resource: 'reports', action: 'view', description: 'View reports' },
    { resource: 'reports', action: 'export', description: 'Export reports' },
    { resource: 'reports', action: 'configure', description: 'Configure reports' },
    { resource: 'analytics', action: 'view', description: 'View analytics' },
    { resource: 'analytics', action: 'manage', description: 'Manage analytics' },

    // Modules
    { resource: 'performance', action: 'view', description: 'View performance module' },
    { resource: 'performance', action: 'manage_cycles', description: 'Manage performance cycles' },
    { resource: 'performance', action: 'review', description: 'Submit performance reviews' },
    { resource: 'recruitment', action: 'manage', description: 'Manage recruitment (jobs, applicants)' },
    { resource: 'training', action: 'view', description: 'View training courses' },
    { resource: 'training', action: 'manage', description: 'Manage training courses' },
  ]

  const permissionsMap = new Map<string, string>()

  for (const p of permissions) {
    const permission = await prisma.permission.create({
      data: p,
    })
    permissionsMap.set(`${p.resource}.${p.action}`, permission.id)
  }
  console.log(`✅ ${permissions.length} Permissions created`)

  // Role Configuration Helper
  const resolvePermissionIds = (patterns: string[]) => {
    if (patterns.includes('*')) {
      return Array.from(new Set(permissionsMap.values()))
    }

    const ids = new Set<string>()
    for (const pattern of patterns) {
      if (pattern.endsWith('.*')) {
        const resourcePrefix = pattern.replace('.*', '')
        for (const [key, id] of permissionsMap.entries()) {
          if (key.startsWith(`${resourcePrefix}.`)) {
            ids.add(id)
          }
        }
        continue
      }
      const id = permissionsMap.get(pattern)
      if (id) ids.add(id)
    }
    return Array.from(ids)
  }

  // Define HRM Roles
  const roles = [
    {
      name: 'Super Admin',
      description: 'System-wide access to all organizations and settings.',
      isSystem: true,
      permissions: ['*']
    },
    {
      name: 'HR Manager',
      description: 'Full access to human resource operations.',
      isSystem: false,
      permissions: [
        'employees.*', 'departments.manage', 'roles.manage', 'roles.assign',
        'attendance.view', 'attendance.manage', 'leave_requests.*', 'leave_policies.manage',
        'payroll.*', 'benefits.*', 'expenses.*', 'onboarding.*', 'offboarding.*',
        'assets.*', 'compliance.*', 'reports.*', 'analytics.*', 'training.*',
        'performance.*', 'recruitment.manage', 'notifications.manage'
      ]
    },
    {
      name: 'Department Manager',
      description: 'Management access for department heads.',
      isSystem: false,
      permissions: [
        'employees.view', 'employees.view_details', 'attendance.view',
        'leave_requests.view', 'leave_requests.approve',
        'performance.view', 'performance.review', 'training.view',
        'reports.view', 'onboarding.view', 'offboarding.view',
        'expenses.view', 'expenses.approve'
      ]
    },
    {
      name: 'Recruiter',
      description: 'Talent acquisition focused access.',
      isSystem: false,
      permissions: [
        'recruitment.manage', 'onboarding.*', 'employees.view',
        'training.view', 'notifications.manage'
      ]
    },
    {
      name: 'Employee',
      description: 'General employee access for self-service.',
      isSystem: true,
      permissions: [
        'auth.update_own_profile', 'auth.change_own_password',
        'notifications.update_own_notifications', 'employees.view',
        'leave_requests.view', 'leave_requests.manage',
        'payroll.view', 'benefits.view', 'expenses.view', 'training.view', 'performance.review'
      ]
    }
  ]

  const dbRoles = new Map<string, string>()

  for (const roleConfig of roles) {
    const role = await prisma.role.create({
      data: {
        name: roleConfig.name,
        description: roleConfig.description,
        isSystem: roleConfig.isSystem
      }
    })
    dbRoles.set(role.name, role.id)

    const permissionIds = resolvePermissionIds(roleConfig.permissions)
    if (permissionIds.length) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId
        }))
      })
    }
  }
  console.log('✅ Roles & Permissions assigned')

  // 3. Create Departments
  const deptConfigs = [
    { name: 'Executive', description: 'Company Leadership' },
    { name: 'Human Resources', description: 'People and Culture' },
    { name: 'Engineering', description: 'Product and Technology' },
    { name: 'Talent Acquisition', description: 'Hiring and Onboarding' },
    { name: 'Marketing', description: 'Growth and Brand' }
  ]

  const dbDepts = new Map<string, string>()
  for (const d of deptConfigs) {
    const dept = await prisma.department.create({
      data: { ...d, organizationId: demoOrg.id }
    })
    dbDepts.set(d.name, dept.id)
  }
  console.log('✅ Departments created')

  // 4. Create Users representing each Role
  const hashedPassword = await bcrypt.hash('password123', 10)

  const userConfigs = [
    {
      email: 'admin@novahr.com',
      firstName: 'System',
      lastName: 'Admin',
      role: 'Super Admin',
      dept: 'Executive',
      empNo: 'EMP001'
    },
    {
      email: 'hr@novahr.com',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: 'HR Manager',
      dept: 'Human Resources',
      empNo: 'EMP002'
    },
    {
      email: 'manager@novahr.com',
      firstName: 'David',
      lastName: 'Chen',
      role: 'Department Manager',
      dept: 'Engineering',
      empNo: 'EMP003'
    },
    {
      email: 'recruiter@novahr.com',
      firstName: 'Alice',
      lastName: 'Foster',
      role: 'Recruiter',
      dept: 'Talent Acquisition',
      empNo: 'EMP004'
    },
    {
      email: 'employee@novahr.com',
      firstName: 'Michael',
      lastName: 'Scott',
      role: 'Employee',
      dept: 'Marketing',
      empNo: 'EMP005'
    }
  ]

  for (const u of userConfigs) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: dbRoles.get(u.role)!,
        organizationId: demoOrg.id,
        status: 'active',
        verified: true,
        avatarUrl: `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random&color=fff`
      }
    })

    // Super Admin is a system administrator, not an employee - skip employee record creation
    if (u.role !== 'Super Admin') {
      await prisma.employee.create({
        data: {
          userId: user.id,
          organizationId: demoOrg.id,
          departmentId: dbDepts.get(u.dept),
          employeeNumber: u.empNo,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          hireDate: new Date(),
          salary: new Prisma.Decimal('0'),
          status: 'active'
        }
      })
    }
    console.log(`✅ ${u.role} user created: ${u.email} / password123`)
  }

  console.log('🚀 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })