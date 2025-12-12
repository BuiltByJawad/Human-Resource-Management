import { Request, Response } from 'express';
import { organizationService } from './organization.service';
import { asyncHandler } from '../../shared/utils/async-handler';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationService.getSettings();
    res.json({ success: true, data: org });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationService.updateSettings(req.body);
    res.json({ success: true, data: org, message: 'Organization settings updated' });
});
