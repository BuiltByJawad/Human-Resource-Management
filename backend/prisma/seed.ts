import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  // 1. Create Permissions
  const permissions = [
    // Employee Management
    { resource: 'employees', action: 'create', description: 'Create new employees' },
    { resource: 'employees', action: 'read', description: 'View employee profiles' },
    { resource: 'employees', action: 'update', description: 'Update employee details' },
    { resource: 'employees', action: 'delete', description: 'Remove employees' },

    // Department Management
    { resource: 'departments', action: 'manage', description: 'Manage departments' },

    // Leave Management
    { resource: 'leave', action: 'request', description: 'Request leave' },
    { resource: 'leave', action: 'approve', description: 'Approve leave requests' },
    { resource: 'leave', action: 'manage', description: 'Manage leave policies' },

    // Payroll
    { resource: 'payroll', action: 'view', description: 'View own payroll' },
    { resource: 'payroll', action: 'manage', description: 'Process payroll' },

    // Reports
    { resource: 'reports', action: 'view', description: 'View reports' },
    { resource: 'reports', action: 'generate', description: 'Generate system reports' },
  ]

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: p,
    })
  }
  console.log('✅ Permissions created')

  // 2. Create Roles
  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: ['*'] // Special handling in code, or assign all
    },
    {
      name: 'HR Admin',
      description: 'HR Department Administrator',
      isSystem: false,
      permissions: ['employees.*', 'departments.*', 'leave.manage', 'payroll.manage', 'reports.*']
    },
    {
      name: 'Manager',
      description: 'Team Manager',
      isSystem: false,
      permissions: ['employees.read', 'leave.approve', 'reports.view']
    },
    {
      name: 'Employee',
      description: 'Standard Employee',
      isSystem: true,
      permissions: ['employees.read', 'leave.request', 'payroll.view']
    }
  ]

  // Helper to find permission IDs
  const allPermissions = await prisma.permission.findMany()

  for (const r of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem
      }
    })

    // Assign permissions
    if (r.permissions.includes('*')) {
      // Assign all permissions
      for (const p of allPermissions) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: createdRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: createdRole.id, permissionId: p.id }
        })
      }
    } else {
      // Assign specific permissions
      for (const pPattern of r.permissions) {
        const [resource, action] = pPattern.split('.')
        const matches = allPermissions.filter(p =>
          p.resource === resource && (action === '*' || p.action === action)
        )

        for (const p of matches) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: createdRole.id, permissionId: p.id } },
            update: {},
            create: { roleId: createdRole.id, permissionId: p.id }
          })
        }
      }
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