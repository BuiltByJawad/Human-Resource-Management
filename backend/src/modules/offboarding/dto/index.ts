
import Joi from 'joi';

export interface InitiateOffboardingDto {
    employeeId: string;
    exitDate: string; // ISO Date
    reason: string; // "Resignation", "Termination", "Contract End", "Retirement"
    notes?: string;
}

export interface UpdateOffboardingTaskDto {
    status: 'pending' | 'completed';
    completedBy?: string;
}

export const initiateOffboardingSchema = Joi.object({
    employeeId: Joi.string().uuid().required(),
    exitDate: Joi.date().iso().required(),
    reason: Joi.string().required(),
    notes: Joi.string().optional(),
});

export const updateOffboardingTaskSchema = Joi.object({
    status: Joi.string().valid('pending', 'completed').required(),
    completedBy: Joi.string().optional(),
});
