
import { benefitsRepository } from './benefits.repository';
import { CreateBenefitPlanDto, EnrollBenefitDto } from './dto';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';

export class BenefitsService {
    async createPlan(data: CreateBenefitPlanDto) {
        return benefitsRepository.createPlan(data);
    }

    async getPlans() {
        return benefitsRepository.getPlans();
    }

    async enrollEmployee(data: EnrollBenefitDto) {
        const { employeeId, benefitPlanId, coverageStartDate } = data;

        // Check if plan exists
        const plan = await benefitsRepository.getPlanById(benefitPlanId);
        if (!plan) {
            throw new NotFoundError('Benefit plan not found');
        }

        // Check if already enrolled
        const existing = await benefitsRepository.getEnrollment(employeeId, benefitPlanId);
        if (existing && existing.status === 'active') {
            throw new BadRequestError('Employee already enrolled in this plan');
        }

        return benefitsRepository.enrollEmployee({
            employeeId,
            benefitPlanId,
            coverageStartDate: new Date(coverageStartDate),
            status: 'active',
        });
    }

    async getEmployeeBenefits(employeeId: string) {
        const benefits = await benefitsRepository.getEmployeeBenefits(employeeId);

        let totalCostToEmployee = 0;
        let totalCostToCompany = 0;

        const activeBenefits = benefits.map((b: any) => {
            const plan = b.benefitPlan;
            totalCostToEmployee += Number(plan.costToEmployee);
            totalCostToCompany += Number(plan.costToCompany);
            return {
                ...b,
                planName: plan.name,
                planType: plan.type,
                cost: plan.costToEmployee,
            };
        });

        return {
            benefits: activeBenefits,
            summary: {
                totalCostToEmployee,
                totalCostToCompany,
            }
        };
    }
}

export const benefitsService = new BenefitsService();
