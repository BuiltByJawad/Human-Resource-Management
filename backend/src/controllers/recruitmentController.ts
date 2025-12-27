import { Request, Response } from 'express'
import { prisma } from '@/shared/config/database'

export const getJobPostings = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.jobPosting.findMany({
            include: {
                department: true,
                _count: {
                    select: { applicants: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ success: true, data: jobs })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch job postings' })
    }
}

export const createJobPosting = async (req: Request, res: Response) => {
    try {
        const { title, departmentId, description, requirements, closingDate } = req.body
        const job = await prisma.jobPosting.create({
            data: {
                title,
                departmentId,
                description,
                requirements,
                closingDate: closingDate ? new Date(closingDate) : null
            }
        })
        res.status(201).json({ success: true, data: job })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create job posting' })
    }
}

export const getApplicants = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.query
        const where = jobId ? { jobId: String(jobId) } : {}

        const applicants = await prisma.applicant.findMany({
            where,
            include: {
                job: {
                    select: { title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ success: true, data: applicants })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch applicants' })
    }
}

export const createApplicant = async (req: Request, res: Response) => {
    try {
        const { jobId, firstName, lastName, email, phone, resumeUrl } = req.body
        const applicant = await prisma.applicant.create({
            data: {
                jobId,
                firstName,
                lastName,
                email,
                phone,
                resumeUrl
            }
        })
        res.status(201).json({ success: true, data: applicant })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create applicant' })
    }
}

export const updateApplicantStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const applicant = await prisma.applicant.update({
            where: { id },
            data: { status }
        })
        res.json({ success: true, data: applicant })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update applicant status' })
    }
}
