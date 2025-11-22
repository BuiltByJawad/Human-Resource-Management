import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@novahr.com' } })
    if (!user) {
        console.log('User not found')
        return
    }

    const token = jwt.sign({ userId: user.id, role: 'Super Admin' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', { expiresIn: '1h' })
    console.log(token)
}

main().finally(() => prisma.$disconnect())
