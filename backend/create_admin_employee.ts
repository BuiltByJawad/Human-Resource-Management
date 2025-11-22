import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@novahr.com'
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        console.log('Admin user not found')
        return
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({ where: { userId: user.id } })
    if (existingEmployee) {
        console.log('Employee record already exists for admin')
        return
    }

    // Create employee record
    const employee = await prisma.employee.create({
        data: {
            userId: user.id,
            employeeNumber: 'EMP-ADMIN',
            firstName: user.firstName || 'System',
            lastName: user.lastName || 'Admin',
            email: user.email,
            hireDate: new Date(),
            salary: 0,
            status: 'active',
        }
    })

    console.log('Created employee record for admin:', employee.id)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
