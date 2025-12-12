import { Request, Response } from 'express';
import { complianceService } from './compliance.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await complianceService.getAll(req.query);
    res.json({ success: true, data: result.records, pagination: result.pagination });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const record = await complianceService.getById(req.params.id);
    res.json({ success: true, data: record });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const record = await complianceService.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: record, message: 'Compliance record created' });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const record = await complianceService.update(req.params.id, req.body);
    res.json({ success: true, data: record, message: 'Compliance record updated' });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await complianceService.delete(req.params.id);
    res.json({ success: true, message: 'Compliance record deleted' });
});
