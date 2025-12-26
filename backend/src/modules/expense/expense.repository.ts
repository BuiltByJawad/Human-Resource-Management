
import { prisma } from '../../shared/config/database';
import { ExpenseClaim } from '@prisma/client';

export class ExpenseRepository {
    async createClaim(data: any): Promise<ExpenseClaim> {
        return prisma.expenseClaim.create({ data });
    }

    async findById(id: string, organizationId: string): Promise<ExpenseClaim | null> {
        return prisma.expenseClaim.findUnique({
            where: { id },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } }, organizationId: true }
                }
            }
        }).then((claim) => {
            if (!claim) return null;
            if ((claim as any).employee?.organizationId !== organizationId) return null;
            return claim;
        });
    }

    async findByEmployee(employeeId: string, organizationId: string): Promise<ExpenseClaim[]> {
        return prisma.expenseClaim.findMany({
            where: { employeeId, employee: { organizationId } },
            orderBy: { date: 'desc' }
        });
    }

    async findAllPending(organizationId: string): Promise<ExpenseClaim[]> {
        return prisma.expenseClaim.findMany({
            where: { status: 'pending', employee: { organizationId } },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } }
                }
            },
            orderBy: { date: 'asc' }
        });
    }

    async updateStatus(id: string, data: any, organizationId: string): Promise<ExpenseClaim | null> {
        const updated = await prisma.expenseClaim.updateMany({
            where: { id, employee: { organizationId } },
            data,
        });

        if (!updated.count) {
            return null;
        }

        return prisma.expenseClaim.findUnique({
            where: { id },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } }
                }
            }
        });
    }
}

export const expenseRepository = new ExpenseRepository();
