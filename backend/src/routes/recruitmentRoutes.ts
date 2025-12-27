import express from 'express'
import { authenticate, checkPermission } from '@/shared/middleware/auth'
import {
    getJobPostings,
    createJobPosting,
    getApplicants,
    createApplicant,
    updateApplicantStatus
} from '@/controllers/recruitmentController'

const router = express.Router()

// Job Postings
router.get('/jobs', authenticate, getJobPostings)
router.post('/jobs', authenticate, checkPermission('recruitment', 'manage'), createJobPosting)

// Applicants
router.get('/applicants', authenticate, getApplicants)
router.post('/applicants', authenticate, createApplicant)
router.patch('/applicants/:id/status', authenticate, checkPermission('recruitment', 'manage'), updateApplicantStatus)

export default router
