
import Joi from 'joi';

export interface CreateTemplateDto {
    name: string;
    description?: string;
    position?: string;
    departmentId?: string;
}

export interface CreateTaskDto {
    templateId: string;
    title: string;
    description?: string;
    assigneeRole?: string; // "HR", "Manager", "IT", "Self"
    dueInDays: number;
    isRequired?: boolean;
    order?: number;
}

export interface StartOnboardingDto {
    employeeId: string;
    templateId: string;
    startDate: string; // ISO Date
}

export interface UpdateTaskStatusDto {
    status: 'pending' | 'completed' | 'skipped';
    completedBy?: string;
}

export const createTemplateSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    position: Joi.string().optional(),
    departmentId: Joi.string().uuid().optional(),
});

export const createTaskSchema = Joi.object({
    templateId: Joi.string().uuid().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    assigneeRole: Joi.string().valid('HR', 'Manager', 'IT', 'Self').optional(),
    dueInDays: Joi.number().min(0).required(),
    isRequired: Joi.boolean().optional(),
    order: Joi.number().optional(),
});

export const startOnboardingSchema = Joi.object({
    employeeId: Joi.string().uuid().required(),
    templateId: Joi.string().uuid().required(),
    startDate: Joi.date().iso().required(),
});

export const updateTaskStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'completed', 'skipped').required(),
    completedBy: Joi.string().optional(),
});
