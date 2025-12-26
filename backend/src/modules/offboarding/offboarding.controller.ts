
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { offboardingService } from './offboarding.service';
import { initiateOffboardingSchema, updateOffboardingTaskSchema } from './dto';
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const initiateOffboarding = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = initiateOffboardingSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const organizationId = requireRequestOrganizationId(req as any);
    const process = await offboardingService.initiateOffboarding(value, organizationId);
    res.status(201).json({ success: true, data: process });
});

export const getOffboarding = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.params.employeeId;

    const authReq: any = req as any;
    const role: string | undefined = authReq?.user?.role;
    const selfEmployeeId: string | undefined = authReq?.user?.employeeId;
    const privilegedRoles = ['Super Admin', 'HR Admin', 'Manager'];

    if (!employeeId) throw new BadRequestError('Employee ID required');
    if (!selfEmployeeId) throw new BadRequestError('Employee profile missing');

    if (employeeId !== selfEmployeeId && !privilegedRoles.includes(role || '')) {
        throw new ForbiddenError('You can only view your own offboarding process');
    }

    const organizationId = requireRequestOrganizationId(req as any);
    const process = await offboardingService.getEmployeeOffboarding(employeeId, organizationId);
    res.json({ success: true, data: process });
});

export const getAllOffboarding = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const processes = await offboardingService.getAllProcesses(organizationId);
    res.json({ success: true, data: processes });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.taskId;
    const { error, value } = updateOffboardingTaskSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const organizationId = requireRequestOrganizationId(req as any);

    const updated = await offboardingService.updateTask(taskId, {
        ...value,
        completedBy: (req as any).user?.id || 'system',
    }, organizationId);

    res.json({ success: true, data: updated });
});
