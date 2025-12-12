
import { prisma } from '../../shared/config/database';
import { ExpenseClaim } from '@prisma/client';

export class ExpenseRepository {
    async createClaim(data: any): Promise<ExpenseClaim> {
        return prisma.expenseClaim.create({ data });
    }

    async findById(id: string): Promise<ExpenseClaim | null> {
        return prisma.expenseClaim.findUnique({
            where: { id },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } }
                }
            }
        });
    }

    async findByEmployee(employeeId: string): Promise<ExpenseClaim[]> {
        return prisma.expenseClaim.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' }
        });
    }

    async findAllPending(): Promise<ExpenseClaim[]> {
        return prisma.expenseClaim.findMany({
            where: { status: 'pending' },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } }
                }
            },
            orderBy: { date: 'asc' }
        });
    }

    async updateStatus(id: string, data: any): Promise<ExpenseClaim> {
        return prisma.expenseClaim.update({
            where: { id },
            data
        });
    }
}

export const expenseRepository = new ExpenseRepository();
