import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:5000/api'

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@novahr.com' } })
    if (!user) {
        console.log('User not found')
        return
    }

    const token = jwt.sign({ userId: user.id, role: 'Super Admin' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', { expiresIn: '1h' })

    try {
        const response = await fetch(`${API_URL}/attendance?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()
        console.log('Status:', response.status)
        console.log('Response:', JSON.stringify(data, null, 2))
    } catch (error: any) {
        console.error('GET Failed:', error.message)
    }
}

main().finally(() => prisma.$disconnect())
