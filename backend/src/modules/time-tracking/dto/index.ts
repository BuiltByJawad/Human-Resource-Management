
import Joi from 'joi';

export interface CreateProjectDto {
    name: string;
    description?: string;
    client?: string;
    startDate: string; // ISO
    endDate?: string;
}

export interface ClockInDto {
    employeeId: string;
    projectId?: string;
    date: string; // ISO
    startTime: string; // ISO
    description?: string;
}

export interface ClockOutDto {
    endTime: string; // ISO
}

export interface ManualEntryDto {
    employeeId: string;
    projectId?: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
}

export const createProjectSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    client: Joi.string().optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().optional().allow(null),
});

export const clockInSchema = Joi.object({
    employeeId: Joi.string().uuid().optional(),
    projectId: Joi.string().uuid().optional(),
    date: Joi.date().iso().required(),
    startTime: Joi.date().iso().required(),
    description: Joi.string().optional(),
});

export const clockOutSchema = Joi.object({
    endTime: Joi.date().iso().required(),
});

export const manualEntrySchema = Joi.object({
    employeeId: Joi.string().uuid().optional(),
    projectId: Joi.string().uuid().optional(),
    date: Joi.date().iso().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    description: Joi.string().optional(),
});
