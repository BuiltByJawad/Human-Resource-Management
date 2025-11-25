import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cycle = await prisma.reviewCycle.create({
        data: {
            title: 'Q4 2024 Performance Review',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: 'active'
        }
    });
    console.log('Created review cycle:', cycle);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
