import { Request, Response } from 'express';
import { performanceService } from './performance.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
    const result = await performanceService.getAllReviews(req.query);
    res.json({ success: true, data: result.reviews, pagination: result.pagination });
});

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const review = await performanceService.getReviewById(req.params.id);
    res.json({ success: true, data: review });
});

export const createReview = asyncHandler(async (req: any, res: Response) => {
    const reviewerId = req.user?.employeeId || req.user?.id;
    const review = await performanceService.createReview(req.body, reviewerId);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: review, message: 'Review submitted' });
});

export const getCycles = asyncHandler(async (req: Request, res: Response) => {
    const cycles = await performanceService.getCycles();
    res.json({ success: true, data: cycles });
});

export const createCycle = asyncHandler(async (req: Request, res: Response) => {
    const cycle = await performanceService.createCycle(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: cycle, message: 'Review cycle created' });
});
