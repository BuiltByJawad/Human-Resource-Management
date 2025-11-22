import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const checkUser = async () => {
    try {
        const email = 'admin@novahr.com'
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: true,
                employee: true
            }
        })

        console.log('User details:', JSON.stringify(user, null, 2))
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUser()
