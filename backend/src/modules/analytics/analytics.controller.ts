import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const metrics = await analyticsService.getDashboardMetrics(organizationId, req.query);
    res.json({ success: true, data: metrics });
});

export const getDepartmentStats = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const stats = await analyticsService.getDepartmentStats(organizationId);
    res.json({ success: true, data: stats });
});
