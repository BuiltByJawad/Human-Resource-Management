import { Router } from 'express';
import { authenticate, checkPermission } from '../../shared/middleware/auth';
import {
    getJobPostings,
    createJobPosting,
    getApplicants,
    createApplicant,
    updateApplicantStatus,
} from '../../controllers/recruitmentController';

/**
 * @swagger
 * tags:
 *   name: Recruitment
 *   description: Job postings and applicant tracking
 */

const router = Router();

router.use(authenticate);

router.get('/jobs', getJobPostings);
router.post('/jobs', checkPermission('recruitment', 'manage'), createJobPosting);

router.get('/applicants', getApplicants);
router.post('/applicants', createApplicant);
router.patch('/applicants/:id/status', checkPermission('recruitment', 'manage'), updateApplicantStatus);

export default router;
