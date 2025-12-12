
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { onboardingService } from './onboarding.service';
import {
    createTemplateSchema,
    createTaskSchema,
    startOnboardingSchema,
    updateTaskStatusSchema
} from './dto';

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTemplateSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message); // middleware handles 400? or explicit throw

    const template = await onboardingService.createTemplate(value);
    res.status(201).json({ success: true, data: template });
});

export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
    const templates = await onboardingService.getTemplates();
    res.json({ success: true, data: templates });
});

export const addTaskToTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const task = await onboardingService.addTaskToTemplate(value);
    res.status(201).json({ success: true, data: task });
});

export const startOnboarding = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = startOnboardingSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const process = await onboardingService.startOnboarding(value);
    res.status(201).json({ success: true, data: process });
});

export const getMyOnboarding = asyncHandler(async (req: Request, res: Response) => {
    // Assuming user id is attached to req.user and we can find employee from it
    // For now, allow passing employeeId param for flexibility
    const employeeId = req.params.employeeId;
    const process = await onboardingService.getEmployeeOnboarding(employeeId);
    res.json({ success: true, data: process });
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.taskId;
    const { error, value } = updateTaskStatusSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    // Potentially add completedBy from logged in user
    const updated = await onboardingService.updateTaskStatus(taskId, {
        ...value,
        completedBy: (req as any).user?.id || 'system',
    });

    res.json({ success: true, data: updated });
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const data = await onboardingService.getDashboard();
    res.json({ success: true, data });
});
