import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);

        if (count > 0) {
            const user = await prisma.user.findFirst({
                include: { role: true }
            });
            console.log('Sample user:', {
                email: user?.email,
                role: user?.role.name,
                password: user?.password ? '(hashed)' : 'none'
            });
        }
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
