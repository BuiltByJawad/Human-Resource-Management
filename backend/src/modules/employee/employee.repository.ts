import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class EmployeeRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.EmployeeWhereInput;
        orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    }) {
        const { where, ...rest } = params;
        return prisma.employee.findMany({
            ...rest,
            where: { ...(where ?? {}) },
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

    async count(where?: Prisma.EmployeeWhereInput) {
        return prisma.employee.count({ where: { ...(where ?? {}) } });
    }

    async findById(id: string) {
        return prisma.employee.findFirst({
            where: { id },
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

    async findByEmail(email: string) {
        return prisma.employee.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.EmployeeCreateInput) {
        return prisma.employee.create({
            data: {
                ...data,
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

    async update(id: string, data: Prisma.EmployeeUpdateInput) {
        // Workspace ownership is already validated in the service via getById,
        // so we can safely update by primary key here to allow relational updates.
        return prisma.employee.update({
            where: { id },
            data,
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

    async delete(id: string) {
        const result = await prisma.employee.deleteMany({
            where: { id },
        });

        return result.count;
    }

    async getEmployeeCount() {
        return prisma.employee.count({});
    }

    async deleteWithUser(employeeId: string, userId: string | null) {
        return prisma.$transaction(async (tx) => {
            // Delete employee first
            const deleted = await tx.employee.deleteMany({
                where: { id: employeeId },
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
