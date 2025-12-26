
import Joi from 'joi';

export interface CreateExpenseDto {
    employeeId: string;
    amount: number;
    currency?: string;
    category: string;
    date: string; // ISO
    description?: string;
    receiptUrl?: string; // Optional
}

export interface UpdateExpenseStatusDto {
    status: 'approved' | 'rejected' | 'reimbursed';
    rejectionReason?: string;
    approvedBy?: string;
}

export const createExpenseSchema = Joi.object({
    employeeId: Joi.string().uuid().optional(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().default('USD'),
    category: Joi.string().valid('Travel', 'Meals', 'Equipment', 'Training', 'Other').required(),
    date: Joi.date().iso().required(),
    description: Joi.string().optional(),
    receiptUrl: Joi.string().uri().optional().allow(null, ''),
});

export const updateExpenseStatusSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected', 'reimbursed').required(),
    rejectionReason: Joi.string().when('status', {
        is: 'rejected',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, '')
    }),
});
