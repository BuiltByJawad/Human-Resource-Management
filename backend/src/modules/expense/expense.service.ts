
import { expenseRepository } from './expense.repository';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto';
import { NotFoundError } from '../../shared/utils/errors';

export class ExpenseService {
    async submitClaim(data: CreateExpenseDto) {
        return expenseRepository.createClaim({
            ...data,
            date: new Date(data.date),
            status: 'pending'
        });
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

        return expenseRepository.updateStatus(id, {
            status: data.status,
            rejectionReason: data.status === 'rejected' ? data.rejectionReason : null,
            approvedBy: data.approvedBy
        });
    }
}

export const expenseService = new ExpenseService();
