
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@novahr.com'
    const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } })

    if (!user || !user.employee) {
        console.log('User or employee not found')
        return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const records = await prisma.attendance.findMany({
        where: {
            employeeId: user.employee.id,
            checkIn: {
                gte: today,
                lt: tomorrow,
            },
        },
        orderBy: { checkIn: 'desc' }
    })

    console.log('Current Attendance Records for Today:')
    console.log(JSON.stringify(records, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
