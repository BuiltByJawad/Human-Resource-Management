import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class PayrollRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.PayrollRecordWhereInput;
    }) {
        return prisma.payrollRecord.findMany({
            ...params,
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
        return prisma.payrollRecord.count({ where });
    }

    async findById(id: string) {
        return prisma.payrollRecord.findUnique({
            where: { id },
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
            where: { employeeId },
            orderBy: { payPeriod: 'desc' },
        });
    }

    async findByPeriod(payPeriod: string) {
        return prisma.payrollRecord.findMany({
            where: { payPeriod },
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

    async updateStatus(id: string, status: string) {
        return prisma.payrollRecord.update({
            where: { id },
            data: {
                status: status as any,
                processedAt: status === 'paid' ? new Date() : undefined,
            },
        });
    }

    async getActiveEmployeesWithAttendance(payPeriod: string) {
        const startDate = new Date(`${payPeriod}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        return prisma.employee.findMany({
            where: { status: 'active' },
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
}

export const payrollRepository = new PayrollRepository();
