import { payrollRepository } from './payroll.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { GeneratePayrollDto, UpdatePayrollStatusDto, PayrollQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class PayrollService {
    /**
     * Get all payroll records with pagination
     */
    async getAll(query: PayrollQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.payPeriod) {
            where.payPeriod = query.payPeriod;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }

        const [records, total] = await Promise.all([
            payrollRepository.findAll({ where, skip, take: limit }),
            payrollRepository.count(where),
        ]);

        return {
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get payroll record by ID
     */
    async getById(id: string) {
        const record = await payrollRepository.findById(id);

        if (!record) {
            throw new NotFoundError('Payroll record not found');
        }

        return record;
    }

    /**
     * Generate payroll for a period
     */
    async generatePayroll(data: GeneratePayrollDto) {
        // Validate pay period format (YYYY-MM)
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(data.payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        // Get active employees with attendance for the period
        const employees = await payrollRepository.getActiveEmployeesWithAttendance(data.payPeriod);

        if (employees.length === 0) {
            throw new BadRequestError('No active employees found for payroll generation');
        }

        const payrolls = [];

        for (const employee of employees) {
            // Calculate payroll
            const calculation = this.calculatePayroll(employee, data.payPeriod);

            // Upsert payroll record
            const payroll = await payrollRepository.upsert({
                employeeId: employee.id,
                payPeriod: data.payPeriod,
                ...calculation,
                status: 'draft',
            });

            payrolls.push(payroll);
        }

        return {
            message: `Generated payroll for ${payrolls.length} employees`,
            payrolls,
        };
    }

    /**
     * Calculate payroll for an employee
     */
    private calculatePayroll(employee: any, payPeriod: string) {
        const baseSalary = Number(employee.salary);

        // Calculate allowances (10% of base salary - simplified)
        const allowances = baseSalary * 0.1;

        // Calculate deductions (5% tax - simplified)
        const deductions = baseSalary * 0.05;

        // Net salary
        const netSalary = baseSalary + allowances - deductions;

        // Attendance summary
        const daysWorked = employee.attendance?.length || 0;
        const totalOvertime = employee.attendance?.reduce(
            (acc: number, curr: any) => acc + Number(curr.overtimeHours || 0),
            0
        ) || 0;

        return {
            baseSalary,
            allowances,
            deductions,
            netSalary,
            allowancesBreakdown: [
                { name: 'Standard Allowance', amount: allowances },
            ],
            deductionsBreakdown: [
                { name: 'Tax', amount: deductions },
            ],
            attendanceSummary: {
                daysWorked,
                totalOvertime,
            },
        };
    }

    /**
     * Update payroll status
     */
    async updateStatus(id: string, data: UpdatePayrollStatusDto) {
        await this.getById(id); // Verify exists

        const record = await payrollRepository.updateStatus(id, data.status);

        // TODO: If status is 'paid', trigger payment processing notification

        return record;
    }

    /**
     * Get employee payslips
     */
    async getEmployeePayslips(employeeId: string) {
        const records = await payrollRepository.findByEmployee(employeeId);

        return records;
    }

    /**
     * Get payroll summary for a period
     */
    async getPeriodSummary(payPeriod: string) {
        const records = await payrollRepository.findByPeriod(payPeriod);

        const summary = {
            totalEmployees: records.length,
            totalBaseSalary: records.reduce((sum, r) => sum + Number(r.baseSalary), 0),
            totalAllowances: records.reduce((sum, r) => sum + Number(r.allowances), 0),
            totalDeductions: records.reduce((sum, r) => sum + Number(r.deductions), 0),
            totalNetSalary: records.reduce((sum, r) => sum + Number(r.netSalary), 0),
            statusBreakdown: {
                draft: records.filter(r => (r.status as any) === 'draft').length,
                approved: records.filter(r => (r.status as any) === 'approved').length,
                paid: records.filter(r => (r.status as any) === 'paid').length,
            },
        };

        return summary;
    }
}

export const payrollService = new PayrollService();
