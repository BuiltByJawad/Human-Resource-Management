import { payrollRepository } from './payroll.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { GeneratePayrollDto, UpdatePayrollStatusDto, PayrollQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';

export class PayrollService {
    private async resolveEmployeeUserId(employeeId: string, organizationId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

    private async resolvePayrollAdminUserIds(organizationId: string): Promise<string[]> {
        const users = await prisma.user.findMany({
            where: {
                status: 'active',
                organizationId,
                role: {
                    permissions: {
                        some: {
                            permission: {
                                resource: 'payroll',
                                action: { in: ['manage', 'generate', 'configure'] },
                            },
                        },
                    },
                },
            },
            select: { id: true },
            take: 50,
        });
        return users.map((u) => u.id);
    }

    /**
     * Get all payroll records with pagination
     */
    async getAll(query: PayrollQueryDto, organizationId: string) {
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
            payrollRepository.findAll({ where, skip, take: limit, organizationId }),
            payrollRepository.count(organizationId, where),
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
    async getById(id: string, organizationId: string) {
        const record = await payrollRepository.findById(id, organizationId);

        if (!record) {
            throw new NotFoundError('Payroll record not found');
        }

        return record;
    }

    /**
     * Generate payroll for a period
     */
    async generatePayroll(data: GeneratePayrollDto, organizationId: string) {
        // Validate pay period format (YYYY-MM)
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(data.payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        // Get active employees with attendance for the period
        const employees = await payrollRepository.getActiveEmployeesWithAttendance(
            data.payPeriod,
            organizationId,
            data.employeeIds
        );

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

        const payrollAdminIds = await this.resolvePayrollAdminUserIds(organizationId);
        await Promise.all(
            Array.from(new Set(payrollAdminIds)).map((userId) =>
                notificationService.create({
                    userId,
                    title: 'Payroll generated',
                    message: `Payroll has been generated for period ${data.payPeriod} (${payrolls.length} employee(s)).`,
                    type: 'payroll',
                    link: '/payroll',
                })
            )
        );

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
    async updateStatus(id: string, data: UpdatePayrollStatusDto, organizationId: string) {
        const existing = await this.getById(id, organizationId); // Verify exists

        const record = await payrollRepository.updateStatusScoped(id, data.status, organizationId);
        if (!record) {
            throw new NotFoundError('Payroll record not found');
        }

        if (data.status === 'paid') {
            const employeeUserId = await this.resolveEmployeeUserId(existing.employeeId, organizationId);
            if (employeeUserId) {
                await notificationService.create({
                    userId: employeeUserId,
                    title: 'Payslip available',
                    message: `Your payslip for ${existing.payPeriod} is now available.`,
                    type: 'payroll',
                    link: '/payroll',
                });
            }
        }

        return record;
    }

    /**
     * Get employee payslips
     */
    async getEmployeePayslips(employeeId: string, organizationId: string) {
        const records = await payrollRepository.findByEmployee(employeeId, organizationId);

        return records;
    }

    /**
     * Get payroll summary for a period
     */
    async getPeriodSummary(payPeriod: string, organizationId: string) {
        const records = await payrollRepository.findByPeriod(payPeriod, organizationId);

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
