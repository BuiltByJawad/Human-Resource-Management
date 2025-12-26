import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class EmployeeRepository {
    private buildWhereWithOrg(organizationId: string, where?: Prisma.EmployeeWhereInput) {
        return { ...(where ?? {}), organizationId } as Prisma.EmployeeWhereInput;
    }

    async findAll(params: {
        skip: number;
        take: number;
        organizationId: string;
        where?: Prisma.EmployeeWhereInput;
        orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    }) {
        const { organizationId, where, ...rest } = params;
        return prisma.employee.findMany({
            ...rest,
            where: this.buildWhereWithOrg(organizationId, where),
            include: {
                department: {
                    select: { id: true, name: true },
                },
                role: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { id: true, verified: true },
                },
            },
        });
    }

    async count(organizationId: string, where?: Prisma.EmployeeWhereInput) {
        return prisma.employee.count({ where: this.buildWhereWithOrg(organizationId, where) });
    }

    async findById(id: string, organizationId: string) {
        return prisma.employee.findFirst({
            where: { id, organizationId },
            include: {
                department: true,
                role: true,
                user: {
                    select: { id: true, verified: true },
                },
                manager: {
                    select: { id: true, firstName: true, lastName: true },
                },
                subordinates: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async findByEmail(email: string, organizationId: string) {
        return prisma.employee.findUnique({
            where: {
                organizationId_email: {
                    organizationId,
                    email,
                },
            },
        });
    }

    async create(data: Prisma.EmployeeCreateInput, organizationId: string) {
        return prisma.employee.create({
            data: {
                ...(data as any),
                organizationId,
            },
            include: {
                department: {
                    select: { id: true, name: true },
                },
                role: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { id: true, verified: true },
                },
            },
        });
    }

    async update(id: string, data: Prisma.EmployeeUpdateInput, organizationId: string) {
        const result = await prisma.employee.updateMany({
            where: { id, organizationId },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.employee.findFirst({
            where: { id, organizationId },
            include: {
                department: {
                    select: { id: true, name: true },
                },
                role: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { id: true, verified: true },
                },
            },
        });
    }

    async delete(id: string, organizationId: string) {
        const result = await prisma.employee.deleteMany({
            where: { id, organizationId },
        });

        return result.count;
    }

    async getEmployeeCount(organizationId: string) {
        return prisma.employee.count({ where: { organizationId } });
    }

    async deleteWithUser(employeeId: string, userId: string | null, organizationId: string) {
        return prisma.$transaction(async (tx) => {
            // Delete employee first
            const deleted = await tx.employee.deleteMany({
                where: { id: employeeId, organizationId },
            });

            if (!deleted.count) {
                return;
            }

            // If linked to user, delete user too
            if (userId) {
                await tx.auditLog.deleteMany({ where: { userId } });
                await tx.user.delete({ where: { id: userId } });
            }
        });
    }
}

export const employeeRepository = new EmployeeRepository();
