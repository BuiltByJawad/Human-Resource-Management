
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { expenseService } from './expense.service';
import { createExpenseSchema, updateExpenseStatusSchema } from './dto';
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors';

export const submitClaim = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const authReq: any = req as any;
    const employeeId = authReq?.user?.employeeId;
    if (!employeeId) throw new BadRequestError('Employee ID required');

    const claim = await expenseService.submitClaim({
        ...(value as any),
        employeeId,
    });
    res.status(201).json({ success: true, data: claim });
});

export const getMyExpenses = asyncHandler(async (req: Request, res: Response) => {
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll =
        permissions.includes('expenses.view') ||
        permissions.includes('expenses.manage') ||
        permissions.includes('expenses.approve');

    const requestedEmployeeId = req.params.employeeId;
    const selfEmployeeId = authReq?.user?.employeeId;
    const employeeId = requestedEmployeeId || selfEmployeeId;
    if (!employeeId) throw new BadRequestError('Employee ID required');

    if (!canViewAll && requestedEmployeeId && selfEmployeeId && requestedEmployeeId !== selfEmployeeId) {
        throw new ForbiddenError('You can only view your own expense claims');
    }

    const claims = await expenseService.getMyExpenses(employeeId);
    res.json({ success: true, data: claims });
});

export const getPendingClaims = asyncHandler(async (req: Request, res: Response) => {
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canAct = permissions.includes('expenses.approve') || permissions.includes('expenses.manage');
    if (!canAct) {
        throw new ForbiddenError('Missing permission: expenses.approve');
    }

    const claims = await expenseService.getPendingClaims();
    res.json({ success: true, data: claims });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const claimId = req.params.id;
    const { error, value } = updateExpenseStatusSchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canAct = permissions.includes('expenses.approve') || permissions.includes('expenses.manage');
    if (!canAct) {
        throw new ForbiddenError('Missing permission: expenses.approve');
    }

    const updated = await expenseService.updateStatus(claimId, {
        ...value,
        approvedBy: (req as any).user?.id
    });
    res.json({ success: true, data: updated });
});
