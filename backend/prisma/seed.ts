import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hrm.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  })
  console.log('✅ Created admin user:', adminUser.email)

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Engineering',
        description: 'Software development and technical operations',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Marketing',
        description: 'Marketing and brand management',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Sales',
        description: 'Sales and business development',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'Human resources and employee management',
      },
    }),
  ])
  console.log('✅ Created departments:', departments.map(d => d.name).join(', '))

  // Create roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'Software Engineer',
        description: 'Software development role',
        permissions: JSON.stringify(['read_employees', 'update_own_profile']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'Senior Software Engineer',
        description: 'Senior software development role',
        permissions: JSON.stringify(['read_employees', 'update_own_profile', 'manage_projects']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'Marketing Manager',
        description: 'Marketing management role',
        permissions: JSON.stringify(['read_employees', 'manage_marketing']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'Sales Representative',
        description: 'Sales role',
        permissions: JSON.stringify(['read_employees', 'manage_sales']),
      },
    }),
  ])
  console.log('✅ Created roles:', roles.map(r => r.name).join(', '))

  // Create employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        departmentId: departments[0].id,
        roleId: roles[0].id,
        hireDate: new Date('2022-01-15'),
        salary: 85000,
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        departmentId: departments[1].id,
        roleId: roles[2].id,
        hireDate: new Date('2021-06-20'),
        salary: 75000,
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP003',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@company.com',
        departmentId: departments[2].id,
        roleId: roles[3].id,
        hireDate: new Date('2023-03-10'),
        salary: 65000,
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        employeeNumber: 'EMP004',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@company.com',
        departmentId: departments[0].id,
        roleId: roles[1].id,
        hireDate: new Date('2020-11-05'),
        salary: 95000,
        status: 'active',
      },
    }),
  ])
  console.log('✅ Created employees:', employees.map(e => `${e.firstName} ${e.lastName}`).join(', '))

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })