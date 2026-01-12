import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class PayrollRepository {
    async findAll(params: {
        skip: number;
        take: number;
        organizationId: string;
        where?: Prisma.PayrollRecordWhereInput;
    }) {
        const { organizationId, where, ...rest } = params;
        return prisma.payrollRecord.findMany({
            ...rest,
            where: {
                ...(where ?? {}),
                employee: {
                    organizationId,
                },
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

    async count(organizationId: string, where?: Prisma.PayrollRecordWhereInput) {
        return prisma.payrollRecord.count({
            where: {
                ...(where ?? {}),
                employee: {
                    organizationId,
                },
            },
        });
    }

    async findById(id: string, organizationId: string) {
        return prisma.payrollRecord.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
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

    async findByEmployee(employeeId: string, organizationId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                employeeId,
                employee: {
                    organizationId,
                },
            },
            orderBy: { payPeriod: 'desc' },
        });
    }

    async findByEmployeeForExport(employeeId: string, organizationId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                employeeId,
                employee: {
                    organizationId,
                },
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

    async findByPeriod(payPeriod: string, organizationId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                payPeriod,
                employee: {
                    organizationId,
                },
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

    async findByPeriodForExport(payPeriod: string, organizationId: string) {
        return prisma.payrollRecord.findMany({
            where: {
                payPeriod,
                employee: {
                    organizationId,
                },
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

    async updateStatusScoped(
        id: string,
        data: {
            status: string;
            paidAt?: Date;
            paymentMethod?: string;
            paymentReference?: string;
            paidByUserId?: string;
        },
        organizationId: string,
    ) {
        const result = await prisma.payrollRecord.updateMany({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
            data: {
                status: data.status as any,
                processedAt: data.status === 'processed' ? new Date() : undefined,
                paidAt: data.status === 'paid' ? data.paidAt : null,
                paymentMethod: data.status === 'paid' ? data.paymentMethod : null,
                paymentReference: data.status === 'paid' ? data.paymentReference : null,
                paidByUserId: data.status === 'paid' ? data.paidByUserId : null,
            },
        });

        if (!result.count) {
            return null;
        }

        return prisma.payrollRecord.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
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

    async getActiveEmployeesWithAttendance(payPeriod: string, organizationId: string, employeeIds?: string[]) {
        const startDate = new Date(`${payPeriod}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        return prisma.employee.findMany({
            where: {
                status: 'active',
                organizationId,
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

    async findOverride(employeeId: string, payPeriod: string, organizationId: string) {
        return prisma.payrollOverride.findFirst({
            where: {
                employeeId,
                payPeriod,
                employee: {
                    organizationId,
                },
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

    async deleteOverride(employeeId: string, payPeriod: string, organizationId: string) {
        const result = await prisma.payrollOverride.deleteMany({
            where: {
                employeeId,
                payPeriod,
                employee: {
                    organizationId,
                },
            },
        });

        return result.count;
    }

    async findOverridesForEmployees(payPeriod: string, employeeIds: string[], organizationId: string) {
        if (!employeeIds.length) return [];
        return prisma.payrollOverride.findMany({
            where: {
                payPeriod,
                employeeId: { in: employeeIds },
                employee: {
                    organizationId,
                },
            },
        });
    }
}

export const payrollRepository = new PayrollRepository();
