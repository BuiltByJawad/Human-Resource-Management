import { Request, Response } from 'express';
import { departmentService } from './department.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const departments = await departmentService.getAll(organizationId);

    res.json({
        status: 'success',
        data: { departments },
    });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const department = await departmentService.getById(req.params.id, organizationId);

    res.json({
        status: 'success',
        data: { department },
    });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const department = await departmentService.create(req.body, organizationId);

    res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: { department },
    });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const department = await departmentService.update(req.params.id, req.body, organizationId);

    res.json({
        status: 'success',
        data: { department },
    });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    await departmentService.delete(req.params.id, organizationId);

    res.json({
        status: 'success',
        message: 'Department deleted successfully',
    });
});
