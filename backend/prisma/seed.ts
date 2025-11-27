import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  // 1. Create Permissions
  const permissions = [
    { resource: 'auth', action: 'update_own_profile', description: 'Update own profile' },
    { resource: 'auth', action: 'change_own_password', description: 'Change own password' },

    { resource: 'notifications', action: 'update_own_notifications', description: 'Update own notification preferences' },
    { resource: 'notifications', action: 'manage', description: 'Manage organization notifications' },
    { resource: 'notifications', action: 'manage_templates', description: 'Manage notification templates' },

    { resource: 'employees', action: 'view', description: 'View employees' },
    { resource: 'employees', action: 'manage', description: 'Create or edit employees' },
    { resource: 'employees', action: 'view_details', description: 'View employee details' },

    { resource: 'roles', action: 'manage', description: 'Manage roles' },
    { resource: 'roles', action: 'assign', description: 'Assign roles to users' },

    { resource: 'departments', action: 'manage', description: 'Manage departments' },

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

    { resource: 'assets', action: 'view', description: 'View assets' },
    { resource: 'assets', action: 'manage', description: 'Manage assets' },
    { resource: 'assets', action: 'assign', description: 'Assign assets' },

    { resource: 'compliance', action: 'view', description: 'View compliance' },
    { resource: 'compliance', action: 'manage', description: 'Manage compliance' },

    { resource: 'reports', action: 'view', description: 'View reports' },
    { resource: 'reports', action: 'export', description: 'Export reports' },
    { resource: 'reports', action: 'configure', description: 'Configure reports' },

    { resource: 'analytics', action: 'view', description: 'View analytics' },
    { resource: 'analytics', action: 'manage', description: 'Manage analytics' },

    { resource: 'performance', action: 'view', description: 'View performance module' },
    { resource: 'performance', action: 'manage_cycles', description: 'Manage performance cycles' },
    { resource: 'performance', action: 'review', description: 'Submit performance reviews' },

    { resource: 'settings', action: 'manage_system_settings', description: 'Manage system settings and branding' },
  ]

  const permissionsMap = new Map<string, string>()

  for (const p of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: { description: p.description },
      create: p,
    })
    permissionsMap.set(`${p.resource}.${p.action}`, permission.id)
  }
  console.log('✅ Permissions created')

  // 2. Create Roles
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
      if (id) {
        ids.add(id)
      } else {
        console.warn(`⚠️ Permission not found for pattern: ${pattern}`)
      }
    }
    return Array.from(ids)
  }

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: ['*']
    },
    {
      name: 'HR Admin',
      description: 'HR Department Administrator',
      isSystem: false,
      permissions: [
        'employees.*',
        'departments.manage',
        'leave_requests.*',
        'leave_policies.manage',
        'attendance.*',
        'payroll.*',
        'reports.*',
        'performance.*',
        'notifications.manage',
        'notifications.manage_templates',
        'roles.manage',
        'roles.assign',
        'settings.manage_system_settings',
        'assets.*',
        'analytics.*',
        'compliance.*'
      ]
    },
    {
      name: 'Manager',
      description: 'Team Manager',
      isSystem: false,
      permissions: [
        'employees.view',
        'employees.view_details',
        'leave_requests.view',
        'leave_requests.approve',
        'attendance.view',
        'reports.view',
        'performance.view',
        'performance.review',
        'assets.view'
      ]
    },
    {
      name: 'Employee',
      description: 'Standard Employee',
      isSystem: true,
      permissions: [
        'auth.update_own_profile',
        'auth.change_own_password',
        'notifications.update_own_notifications',
        'employees.view',
        'leave_requests.view',
        'leave_requests.manage',
        'payroll.view',
        'performance.review'
      ]
    }
  ]

  for (const roleConfig of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: roleConfig.name },
      update: { description: roleConfig.description },
      create: {
        name: roleConfig.name,
        description: roleConfig.description,
        isSystem: roleConfig.isSystem
      }
    })

    await prisma.rolePermission.deleteMany({ where: { roleId: createdRole.id } })

    const permissionIds = resolvePermissionIds(roleConfig.permissions)

    if (permissionIds.length) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({ roleId: createdRole.id, permissionId })),
        skipDuplicates: true
      })
    }
  }
  console.log('✅ Roles & Permissions assigned')

  // 3. Create Departments
  const departments = [
    { name: 'Engineering', description: 'Product Development and Engineering' },
    { name: 'Human Resources', description: 'Employee Relations and Recruitment' },
    { name: 'Sales', description: 'Sales and Marketing' },
    { name: 'Finance', description: 'Financial Planning and Analysis' }
  ]

  for (const d of departments) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d
    })
  }
  console.log('✅ Departments created')

  // 3. Create Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } })

  if (adminRole) {
    const hashedPassword = await bcrypt.hash('password123', 10)

    await prisma.user.upsert({
      where: { email: 'admin@novahr.com' },
      update: {},
      create: {
        email: 'admin@novahr.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: adminRole.id,
        status: 'active',
        avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff'
      }
    })
    console.log('✅ Admin user created: admin@novahr.com / password123')

    // 4. Create Employee record for Admin (Required for Performance Reviews)
    const adminUserRecord = await prisma.user.findUnique({ where: { email: 'admin@novahr.com' } })
    if (adminUserRecord) {
      await prisma.employee.upsert({
        where: { email: 'admin@novahr.com' },
        update: { userId: adminUserRecord.id },
        create: {
          userId: adminUserRecord.id,
          employeeNumber: 'EMP001',
          firstName: 'System',
          lastName: 'Admin',
          email: 'admin@novahr.com',
          hireDate: new Date(),
          salary: 0,
          status: 'active'
        }
      })
      console.log('✅ Admin Employee record created')
    }
  }

  console.log('🌱 Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })