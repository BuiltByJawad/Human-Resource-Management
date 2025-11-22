import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:5000/api'

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@novahr.com' }, include: { employee: true } })
    if (!user || !user.employee) {
        console.log('User or employee not found')
        return
    }

    const token = jwt.sign({ userId: user.id, role: 'Super Admin' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', { expiresIn: '1h' })

    // Get the active attendance record
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeRecord = await prisma.attendance.findFirst({
        where: {
            employeeId: user.employee.id,
            checkIn: {
                gte: today,
                lt: tomorrow,
            },
            checkOut: null
        }
    })

    if (!activeRecord) {
        console.log('No active clock-in found')
        return
    }

    console.log('Clocking out from record:', activeRecord.id)

    try {
        const response = await fetch(`${API_URL}/attendance/clock-out/${activeRecord.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })

        const data = await response.json()
        console.log('Status:', response.status)
        console.log('Response:', JSON.stringify(data, null, 2))
    } catch (error: any) {
        console.error('Clock Out Failed:', error.message)
    }
}

main().finally(() => prisma.$disconnect())
