
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { expenseService } from './expense.service';
import { createExpenseSchema, updateExpenseStatusSchema } from './dto';

export const submitClaim = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const claim = await expenseService.submitClaim(value);
    res.status(201).json({ success: true, data: claim });
});

export const getMyExpenses = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.params.employeeId;
    const claims = await expenseService.getMyExpenses(employeeId);
    res.json({ success: true, data: claims });
});

export const getPendingClaims = asyncHandler(async (req: Request, res: Response) => {
    const claims = await expenseService.getPendingClaims();
    res.json({ success: true, data: claims });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const claimId = req.params.id;
    const { error, value } = updateExpenseStatusSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const updated = await expenseService.updateStatus(claimId, {
        ...value,
        approvedBy: (req as any).user?.id
    });
    res.json({ success: true, data: updated });
});
