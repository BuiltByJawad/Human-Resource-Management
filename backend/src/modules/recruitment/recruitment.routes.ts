import { Router } from 'express';
import * as recruitmentController from './recruitment.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Recruitment
 *   description: Job postings and applicant tracking
 */

const router = Router();

router.get('/jobs', recruitmentController.getAllJobs);
router.get('/jobs/:id', recruitmentController.getJobById);
router.post('/jobs', authenticate, recruitmentController.createJob);
router.get('/applications', authenticate, recruitmentController.getAllApplications);
router.post('/applications', recruitmentController.createApplication); // Public

export default router;
