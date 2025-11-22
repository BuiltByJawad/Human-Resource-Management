import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const linkEmployee = async () => {
    try {
        const email = 'admin@novahr.com'
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.error('User not found')
            return
        }

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { email }
        })

        if (existingEmployee) {
            console.log('Employee already exists. Linking...')
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    employee: {
                        connect: { id: existingEmployee.id }
                    }
                }
            })
            // Also update employee to link to user
            await prisma.employee.update({
                where: { id: existingEmployee.id },
                data: { userId: user.id }
            })
        } else {
            console.log('Creating new employee...')
            const employee = await prisma.employee.create({
                data: {
                    firstName: 'Admin',
                    lastName: 'User',
                    email: email,
                    employeeNumber: 'EMP001',
                    hireDate: new Date(),
                    salary: 50000,
                    userId: user.id,
                    status: 'active'
                }
            })
            console.log('Employee created:', employee.id)
        }

        console.log('Employee linked successfully')
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

linkEmployee()
