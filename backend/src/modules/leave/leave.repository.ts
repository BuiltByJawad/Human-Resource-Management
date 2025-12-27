import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class LeaveRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.LeaveRequestWhereInput;
    }, organizationId: string) {
        const scopedWhere: Prisma.LeaveRequestWhereInput = params.where
            ? { AND: [params.where, { employee: { organizationId } }] }
            : { employee: { organizationId } };

        return prisma.leaveRequest.findMany({
            ...params,
            where: scopedWhere,
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

    async count(where: Prisma.LeaveRequestWhereInput | undefined, organizationId: string) {
        const scopedWhere: Prisma.LeaveRequestWhereInput = where
            ? { AND: [where, { employee: { organizationId } }] }
            : { employee: { organizationId } };

        return prisma.leaveRequest.count({ where: scopedWhere });
    }

    async findById(id: string, organizationId: string) {
        return prisma.leaveRequest.findFirst({
            where: { id, employee: { organizationId } },
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

    async update(id: string, data: Prisma.LeaveRequestUpdateInput, organizationId: string) {
        const updated = await prisma.leaveRequest.updateMany({
            where: { id, employee: { organizationId } },
            data,
        });

        if (!updated.count) {
            return null;
        }

        return prisma.leaveRequest.findFirst({
            where: { id, employee: { organizationId } },
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

    async delete(id: string, organizationId: string) {
        const deleted = await prisma.leaveRequest.deleteMany({
            where: { id, employee: { organizationId } },
        });
        return deleted.count;
    }

    async findByEmployee(employeeId: string, organizationId: string) {
        return prisma.leaveRequest.findMany({
            where: { employeeId, employee: { organizationId } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getLeaveRequestsByStatus(status: string, organizationId: string) {
        return prisma.leaveRequest.findMany({
            where: { status: status as any, employee: { organizationId } },
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                approver: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const leaveRepository = new LeaveRepository();
