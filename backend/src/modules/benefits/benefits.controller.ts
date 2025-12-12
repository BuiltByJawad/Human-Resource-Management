
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { benefitsService } from './benefits.service';
import { createBenefitPlanSchema, enrollBenefitSchema } from './dto';

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createBenefitPlanSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const plan = await benefitsService.createPlan(value);
    res.status(201).json({ success: true, data: plan });
});

export const getPlans = asyncHandler(async (req: Request, res: Response) => {
    const plans = await benefitsService.getPlans();
    res.json({ success: true, data: plans });
});

export const enrollEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = enrollBenefitSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const enrollment = await benefitsService.enrollEmployee(value);
    res.status(201).json({ success: true, data: enrollment });
});

export const getMyBenefits = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.params.employeeId; // Or from query if getting own? Assuming route param for now or extraction from token in future logic if "my-benefits"
    // For simplicity, let's assume route param :employeeId
    const benefits = await benefitsService.getEmployeeBenefits(employeeId);
    res.json({ success: true, data: benefits });
});
