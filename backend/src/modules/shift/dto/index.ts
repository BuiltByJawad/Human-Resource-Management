
import Joi from 'joi';

export interface CreateShiftDto {
    employeeId: string;
    startTime: string; // ISO
    endTime: string; // ISO
    type?: string;
    location?: string;
}

export interface RequestSwapDto {
    shiftId: string;
    targetId?: string;
    reason?: string;
}

export interface UpdateSwapStatusDto {
    status: 'approved' | 'rejected';
}

export const createShiftSchema = Joi.object({
    employeeId: Joi.string().uuid().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required().greater(Joi.ref('startTime')),
    type: Joi.string().valid('Regular', 'Overtime', 'OnCall').optional(),
    location: Joi.string().optional(),
});

export const requestSwapSchema = Joi.object({
    shiftId: Joi.string().uuid().required(),
    targetId: Joi.string().uuid().optional(),
    reason: Joi.string().optional(),
});

export const updateSwapStatusSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
});
