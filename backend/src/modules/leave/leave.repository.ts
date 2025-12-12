import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class LeaveRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.LeaveRequestWhereInput;
    }) {
        return prisma.leaveRequest.findMany({
            ...params,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async count(where?: Prisma.LeaveRequestWhereInput) {
        return prisma.leaveRequest.count({ where });
    }

    async findById(id: string) {
        return prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async create(data: Prisma.LeaveRequestCreateInput) {
        return prisma.leaveRequest.create({
            data,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: Prisma.LeaveRequestUpdateInput) {
        return prisma.leaveRequest.update({
            where: { id },
            data,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async delete(id: string) {
        return prisma.leaveRequest.delete({
            where: { id },
        });
    }

    async findByEmployee(employeeId: string) {
        return prisma.leaveRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getLeaveRequestsByStatus(status: string) {
        return prisma.leaveRequest.findMany({
            where: { status: status as any },
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                approver: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const leaveRepository = new LeaveRepository();
