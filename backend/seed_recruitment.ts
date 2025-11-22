import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // Get a department
        const department = await prisma.department.findFirst()
        if (!department) {
            console.log('No department found, creating one...')
            await prisma.department.create({
                data: {
                    name: 'Engineering',
                    description: 'Engineering Department'
                }
            })
        }

        const dept = await prisma.department.findFirst()
        if (!dept) throw new Error('Failed to get department')

        // Create Job Posting
        const job = await prisma.jobPosting.create({
            data: {
                title: 'Senior Frontend Engineer',
                departmentId: dept.id,
                description: 'We are looking for a React expert.',
                requirements: '5+ years of experience with React, TypeScript, and Next.js.',
                status: 'open'
            }
        })
        console.log('Created Job Posting:', job.id)

        // Create Applicant
        const applicant = await prisma.applicant.create({
            data: {
                jobId: job.id,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                status: 'applied',
                appliedDate: new Date()
            }
        })
        console.log('Created Applicant:', applicant.id)

    } catch (error) {
        console.error('Seeding failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
