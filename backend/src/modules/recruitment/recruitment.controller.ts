import { Request, Response } from 'express';
import { recruitmentService } from './recruitment.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await recruitmentService.getAllJobs();
    res.json({ success: true, data: jobs });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
    const job = await recruitmentService.getJobById(req.params.id);
    res.json({ success: true, data: job });
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await recruitmentService.createJob(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: job, message: 'Job posted' });
});

export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
    const result = await recruitmentService.getAllApplications(req.query);
    res.json({ success: true, data: result.applications, pagination: result.pagination });
});

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
    const application = await recruitmentService.createApplication(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: application, message: 'Application submitted' });
});
