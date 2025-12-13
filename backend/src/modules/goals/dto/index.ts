
import Joi from 'joi';

export interface CreateGoalDto {
    employeeId?: string; // If creating for another (manager)
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}

export interface CreateKeyResultDto {
    goalId: string;
    description: string;
    targetValue: number;
    unit?: string;
}

export interface UpdateGoalStatusDto {
    status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
}

export interface UpdateKeyResultProgressDto {
    currentValue: number;
}

export const createGoalSchema = Joi.object({
    employeeId: Joi.string().uuid().optional(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
});

export const createKeyResultSchema = Joi.object({
    goalId: Joi.string().uuid().required(),
    description: Joi.string().required(),
    targetValue: Joi.number().min(1).required(),
    unit: Joi.string().valid('percentage', 'count', 'currency').optional(),
});

export const updateGoalStatusSchema = Joi.object({
    status: Joi.string().valid('not-started', 'in-progress', 'completed', 'cancelled').required(),
});

export const updateKeyResultProgressSchema = Joi.object({
    currentValue: Joi.number().min(0).required(),
});
