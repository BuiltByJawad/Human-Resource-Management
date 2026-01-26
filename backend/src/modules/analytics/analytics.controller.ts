import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { asyncHandler } from '../../shared/utils/async-handler';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const metrics = await analyticsService.getDashboardMetrics(req.query as any);
    res.json({ success: true, data: metrics });
});

export const getDepartmentStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await analyticsService.getDepartmentStats();
    res.json({ success: true, data: stats });
});

export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
    const events = await analyticsService.getUpcomingEvents(req.query as any);
    res.json({ success: true, data: events });
});
