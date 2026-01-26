import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class PayrollRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.PayrollRecordWhereInput;
    }) {
        const { where, ...rest } = params;
        return prisma.payrollRecord.findMany({
            ...rest,
            where: {
                ...(where ?? {}),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async count(where?: Prisma.PayrollRecordWhereInput) {
        return prisma.payrollRecord.count({
            where: {
                ...(where ?? {}),
            },
        });
    }

    async findById(id: string) {
        return prisma.payrollRecord.findFirst({
            where: {
                id,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        email: true,
                        salary: true,
                        department: {
                            select: { name: true },
                        },
                    },
                },
            },
        });
    }

    async findByEmployee(employeeId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                employeeId,
            },
            orderBy: { payPeriod: 'desc' },
        });
    }

    async findByEmployeeForExport(employeeId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                employeeId,
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { payPeriod: 'desc' },
        });
    }

    async findByPeriod(payPeriod: string) {
        return prisma.payrollRecord.findMany({
            where: {
                payPeriod,
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                    },
                },
            },
        });
    }

    async findByPeriodForExport(payPeriod: string) {
        return prisma.payrollRecord.findMany({
            where: {
                payPeriod,
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: {
                employee: {
                    employeeNumber: 'asc',
                },
            },
        });
    }

    async upsert(data: {
        employeeId: string;
        payPeriod: string;
        baseSalary: number;
        allowances: number;
        deductions: number;
        netSalary: number;
        allowancesBreakdown: any;
        deductionsBreakdown: any;
        attendanceSummary: any;
        status: string;
    }) {
        return prisma.payrollRecord.upsert({
            where: {
                employeeId_payPeriod: {
                    employeeId: data.employeeId,
                    payPeriod: data.payPeriod,
                },
            },
            update: {
                baseSalary: data.baseSalary,
                allowances: data.allowances,
                deductions: data.deductions,
                netSalary: data.netSalary,
                allowancesBreakdown: data.allowancesBreakdown,
                deductionsBreakdown: data.deductionsBreakdown,
                attendanceSummary: data.attendanceSummary,
                status: data.status as any,
            },
            create: {
                employeeId: data.employeeId,
                payPeriod: data.payPeriod,
                baseSalary: data.baseSalary,
                allowances: data.allowances,
                deductions: data.deductions,
                netSalary: data.netSalary,
                allowancesBreakdown: data.allowancesBreakdown,
                deductionsBreakdown: data.deductionsBreakdown,
                attendanceSummary: data.attendanceSummary,
                status: data.status as any,
            },
        });
    }

    async updateStatus(
        id: string,
        data: {
            status: string;
            paidAt?: Date;
            paymentMethod?: string;
            paymentReference?: string;
            paidByUserId?: string;
        },
    ) {
        return prisma.payrollRecord.update({
            where: { id },
            data: {
                status: data.status as any,
                processedAt: data.status === 'processed' ? new Date() : undefined,
                paidAt: data.status === 'paid' ? data.paidAt : undefined,
                paymentMethod: data.status === 'paid' ? data.paymentMethod : undefined,
                paymentReference: data.status === 'paid' ? data.paymentReference : undefined,
                paidByUserId: data.status === 'paid' ? data.paidByUserId : undefined,
            },
        });
    }

    async getActiveEmployeesWithAttendance(payPeriod: string, employeeIds?: string[]) {
        const startDate = new Date(`${payPeriod}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        return prisma.employee.findMany({
            where: {
                status: 'active',
                ...(Array.isArray(employeeIds) && employeeIds.length ? { id: { in: employeeIds } } : {}),
            },
            include: {
                attendance: {
                    where: {
                        checkIn: {
                            gte: startDate,
                            lt: endDate,
                        },
                    },
                },
            },
        });
    }

    async findOverride(employeeId: string, payPeriod: string) {
        return prisma.payrollOverride.findFirst({
            where: {
                employeeId,
                payPeriod,
            },
        });
    }

    async upsertOverride(employeeId: string, payPeriod: string, config: Prisma.InputJsonValue) {
        return prisma.payrollOverride.upsert({
            where: {
                employeeId_payPeriod_override: {
                    employeeId,
                    payPeriod,
                },
            },
            update: {
                config,
            },
            create: {
                employeeId,
                payPeriod,
                config,
            },
        });
    }

    async deleteOverride(employeeId: string, payPeriod: string) {
        const result = await prisma.payrollOverride.deleteMany({
            where: {
                employeeId,
                payPeriod,
            },
        });

        return result.count;
    }

    async findOverridesForEmployees(payPeriod: string, employeeIds: string[]) {
        if (!employeeIds.length) return [];
        return prisma.payrollOverride.findMany({
            where: {
                payPeriod,
                employeeId: { in: employeeIds },
            },
        });
    }
}

export const payrollRepository = new PayrollRepository();
