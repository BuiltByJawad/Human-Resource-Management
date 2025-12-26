import { Request, Response } from 'express';
import { performanceService } from './performance.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll = permissions.includes('performance.view');
    const selfEmployeeId: string | undefined = authReq?.user?.employeeId;

    const query: any = { ...(req.query as any) };
    if (!canViewAll) {
        if (!selfEmployeeId) {
            throw new ForbiddenError('Insufficient permissions');
        }
        // Restrict to reviews where user is the employee OR the reviewer
        query.employeeId = selfEmployeeId;
        (query as any).__restrictReviewerId = selfEmployeeId;
    }

    const result = await performanceService.getAllReviews(organizationId, query);
    res.json({ success: true, data: result.reviews, pagination: result.pagination });
});

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll = permissions.includes('performance.view');
    const selfEmployeeId: string | undefined = authReq?.user?.employeeId;

    const review = await performanceService.getReviewById(organizationId, req.params.id);
    if (!canViewAll) {
        if (!selfEmployeeId || (review.employeeId !== selfEmployeeId && review.reviewerId !== selfEmployeeId)) {
            throw new ForbiddenError('You can only view your own reviews');
        }
    }
    res.json({ success: true, data: review });
});

export const createReview = asyncHandler(async (req: any, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const reviewerEmployeeId = req.user?.employeeId;

    if (!reviewerEmployeeId) {
        throw new ForbiddenError('Reviewer must have an employee profile');
    }

    const review = await performanceService.createReview(organizationId, req.body, reviewerEmployeeId);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: review, message: 'Review submitted' });
});

export const getCycles = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const cycles = await performanceService.getCycles(organizationId);
    res.json({ success: true, data: cycles });
});

export const createCycle = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const cycle = await performanceService.createCycle(organizationId, req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: cycle, message: 'Review cycle created' });
});
