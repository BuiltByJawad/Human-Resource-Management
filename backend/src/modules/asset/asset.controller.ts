import { Request, Response } from 'express';
import { assetService } from './asset.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await assetService.getAll(req.query);

    res.json({
        success: true,
        data: result.assets,
        pagination: result.pagination,
    });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetService.getById(req.params.id);

    res.json({
        success: true,
        data: asset,
    });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetService.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: asset,
        message: 'Asset created successfully',
    });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetService.update(req.params.id, req.body);

    res.json({
        success: true,
        data: asset,
        message: 'Asset updated successfully',
    });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await assetService.delete(req.params.id);

    res.json({
        success: true,
        message: 'Asset deleted successfully',
    });
});

export const getEmployeeAssets = asyncHandler(async (req: Request, res: Response) => {
    const assets = await assetService.getEmployeeAssets(req.params.employeeId);

    res.json({
        success: true,
        data: assets,
    });
});
