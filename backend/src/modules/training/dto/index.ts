
import Joi from 'joi';

export interface CreateCourseDto {
    title: string;
    description?: string;
    contentUrl?: string;
    duration?: number;
}

export interface AssignTrainingDto {
    employeeId: string;
    courseId: string;
}

export interface UpdateProgressDto {
    progress: number;
    status?: string;
}

export const createCourseSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    contentUrl: Joi.string().uri().optional(),
    duration: Joi.number().min(0).optional(),
});

export const assignTrainingSchema = Joi.object({
    employeeId: Joi.string().uuid().required(),
    courseId: Joi.string().uuid().required(),
});

export const updateProgressSchema = Joi.object({
    progress: Joi.number().min(0).max(100).required(),
    status: Joi.string().valid('assigned', 'in-progress', 'completed').optional(),
});
