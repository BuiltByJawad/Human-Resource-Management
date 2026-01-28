import { Request, Response } from 'express';
import { departmentService } from './department.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const departments = await departmentService.getAll();

    res.json({
        status: 'success',
        data: { departments },
    });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.getById(req.params.id);

    res.json({
        status: 'success',
        data: { department },
    });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: { department },
    });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.update(req.params.id, req.body);

    res.json({
        status: 'success',
        data: { department },
    });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await departmentService.delete(req.params.id);

    res.json({
        status: 'success',
        message: 'Department deleted successfully',
    });
});
