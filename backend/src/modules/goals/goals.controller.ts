
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { goalsService } from './goals.service';
import { createGoalSchema, createKeyResultSchema, updateKeyResultProgressSchema } from './dto';

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createGoalSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const creatorId = (req as any).user?.id;
    if (!creatorId) throw new Error("User not authenticated");

    const goal = await goalsService.createGoal(value, creatorId);
    res.status(201).json({ success: true, data: goal });
});

export const getMyGoals = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) throw new Error("User not authenticated");

    const goals = await goalsService.getEmployeeGoals(userId);
    res.json({ success: true, data: goals });
});

export const addKeyResult = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createKeyResultSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const keyResult = await goalsService.addKeyResult(value);
    res.status(201).json({ success: true, data: keyResult });
});

export const updateKeyResultProgress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error, value } = updateKeyResultProgressSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const userId = (req as any).user?.id;
    const updated = await goalsService.updateKeyResultProgress(id, userId, value);
    res.json({ success: true, data: updated });
});
