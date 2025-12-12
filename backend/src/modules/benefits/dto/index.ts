
import Joi from 'joi';

export interface CreateBenefitPlanDto {
    name: string;
    type: string; // "Health", "Dental", "Vision", "Retirement", "Other"
    description?: string;
    provider?: string;
    costToEmployee: number;
    costToCompany: number;
}

export interface EnrollBenefitDto {
    employeeId: string;
    benefitPlanId: string;
    coverageStartDate: string; // ISO Date
}

export const createBenefitPlanSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('Health', 'Dental', 'Vision', 'Retirement', 'Other').required(),
    description: Joi.string().optional(),
    provider: Joi.string().optional(),
    costToEmployee: Joi.number().min(0).required(),
    costToCompany: Joi.number().min(0).required(),
});

export const enrollBenefitSchema = Joi.object({
    employeeId: Joi.string().uuid().required(),
    benefitPlanId: Joi.string().uuid().required(),
    coverageStartDate: Joi.date().iso().required(),
});
