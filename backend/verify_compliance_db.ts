import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...')
        // Try to count rules to see if table exists
        const count = await prisma.complianceRule.count()
        console.log(`ComplianceRule table exists. Count: ${count}`)

        // Try to create a rule
        const rule = await prisma.complianceRule.create({
            data: {
                name: 'Test Rule ' + Date.now(),
                type: 'max_hours_per_week',
                threshold: 40,
                isActive: true
            }
        })
        console.log('Successfully created rule:', rule.id)

        // Clean up
        await prisma.complianceRule.delete({ where: { id: rule.id } })
        console.log('Successfully deleted test rule')

    } catch (error) {
        console.error('Verification failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
