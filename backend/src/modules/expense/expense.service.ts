
import { expenseRepository } from './expense.repository';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto';
import { NotFoundError } from '../../shared/utils/errors';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';

export class ExpenseService {
    private async resolveEmployeeUserId(employeeId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

    private async resolveApproverUserIds(employeeId: string): Promise<string[]> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { managerId: true },
        });

        if (employee?.managerId) {
            const manager = await prisma.employee.findFirst({
                where: { id: employee.managerId },
                select: { userId: true },
            });
            if (manager?.userId) {
                return [manager.userId];
            }
        }

        const approvers = await prisma.user.findMany({
            where: {
                status: 'active',
                role: {
                    permissions: {
                        some: {
                            permission: {
                                resource: 'expenses',
                                action: 'approve',
                            },
                        },
                    },
                },
            },
            select: { id: true },
            take: 25,
        });

        return approvers.map((u) => u.id);
    }

    async submitClaim(data: CreateExpenseDto) {
        const employee = await prisma.employee.findFirst({
            where: { id: data.employeeId },
            select: { firstName: true, lastName: true },
        });

        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        const claim = await expenseRepository.createClaim({
            ...data,
            date: new Date(data.date),
            status: 'pending'
        });

        const employeeName = `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.trim() || 'Employee';

        const approverUserIds = await this.resolveApproverUserIds(claim.employeeId);
        await Promise.all(
            approverUserIds.map((userId) =>
                notificationService.create({
                    userId,
                    title: 'Expense claim submitted',
                    message: `${employeeName} submitted an expense claim for ${claim.amount} ${claim.currency} (${claim.category}).`,
                    type: 'expense',
                    link: '/expenses/approvals',
                })
            )
        );

        return claim;
    }

    async getMyExpenses(employeeId: string) {
        return expenseRepository.findByEmployee(employeeId);
    }

    async getPendingClaims() {
        return expenseRepository.findAllPending();
    }

    async updateStatus(id: string, data: UpdateExpenseStatusDto) {
        const claim = await expenseRepository.findById(id);
        if (!claim) {
            throw new NotFoundError('Expense claim not found');
        }

        const updated = await expenseRepository.updateStatus(id, {
            status: data.status,
            rejectionReason: data.status === 'rejected' ? data.rejectionReason : null,
            approvedBy: data.approvedBy
        });

        if (!updated) {
            throw new NotFoundError('Expense claim not found');
        }

        const employeeUserId = await this.resolveEmployeeUserId(claim.employeeId);
        if (employeeUserId) {
            const titleByStatus: Record<string, string> = {
                approved: 'Expense claim approved',
                rejected: 'Expense claim rejected',
                reimbursed: 'Expense claim reimbursed',
            };
            const title = titleByStatus[data.status] ?? 'Expense claim updated';
            const message =
                data.status === 'rejected'
                    ? `Your expense claim was rejected: ${data.rejectionReason ?? ''}`.trim()
                    : `Your expense claim status is now: ${data.status}.`;

            await notificationService.create({
                userId: employeeUserId,
                title,
                message,
                type: 'expense',
                link: '/expenses',
            });
        }

        return updated;
    }
}

export const expenseService = new ExpenseService();
