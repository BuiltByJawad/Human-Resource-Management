
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { trainingService } from './training.service';
import { createCourseSchema, assignTrainingSchema, updateProgressSchema } from './dto';

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createCourseSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const course = await trainingService.createCourse(value);
    res.status(201).json({ success: true, data: course });
});

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
    const courses = await trainingService.getCourses();
    res.json({ success: true, data: courses });
});

export const assignCourse = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = assignTrainingSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const assignment = await trainingService.assignCourse(value);
    res.status(201).json({ success: true, data: assignment });
});

export const getMyTraining = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user?.id || req.params.employeeId;
    // req.user.id implies logged in user.
    // Ensure we handle the case where user object is populated.
    if (!employeeId) throw new Error("Employee ID required");

    const training = await trainingService.getEmployeeTraining(employeeId);
    res.json({ success: true, data: training });
});

export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error, value } = updateProgressSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const employeeId = (req as any).user?.id;
    if (!employeeId) throw new Error("User not authenticated");

    const updated = await trainingService.updateProgress(id, employeeId, value);
    res.json({ success: true, data: updated });
});
