
import { prisma } from '../../shared/config/database';
import { BenefitPlan, EmployeeBenefit } from '@prisma/client';

export class BenefitsRepository {
    async createPlan(data: any): Promise<BenefitPlan> {
        return prisma.benefitPlan.create({ data });
    }

    async getPlans(): Promise<BenefitPlan[]> {
        return prisma.benefitPlan.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async getPlanById(id: string): Promise<BenefitPlan | null> {
        return prisma.benefitPlan.findUnique({ where: { id } });
    }

    async enrollEmployee(data: any): Promise<EmployeeBenefit> {
        return prisma.employeeBenefit.create({ data });
    }

    async getEmployeeBenefits(employeeId: string): Promise<EmployeeBenefit[]> {
        return prisma.employeeBenefit.findMany({
            where: { employeeId, status: 'active' },
            include: { benefitPlan: true },
        });
    }

    async getEnrollment(employeeId: string, benefitPlanId: string): Promise<EmployeeBenefit | null> {
        return prisma.employeeBenefit.findUnique({
            where: {
                employeeId_benefitPlanId: {
                    employeeId,
                    benefitPlanId,
                },
            },
        });
    }
}

export const benefitsRepository = new BenefitsRepository();
