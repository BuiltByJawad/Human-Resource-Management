import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class EmployeeRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.EmployeeWhereInput;
        orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    }) {
        return prisma.employee.findMany({
            ...params,
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
        return prisma.employee.count({ where });
    }

    async findById(id: string) {
        return prisma.employee.findUnique({
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
        return prisma.employee.findFirst({
            where: { email },
        });
    }

    async create(data: Prisma.EmployeeCreateInput) {
        return prisma.employee.create({
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

    async update(id: string, data: Prisma.EmployeeUpdateInput) {
        return prisma.employee.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.employee.delete({
            where: { id },
        });
    }

    async getEmployeeCount() {
        return prisma.employee.count();
    }

    async deleteWithUser(employeeId: string, userId: string | null) {
        return prisma.$transaction(async (tx) => {
            // Delete employee first
            await tx.employee.delete({
                where: { id: employeeId },
            });

            // If linked to user, delete user too
            if (userId) {
                await tx.auditLog.deleteMany({ where: { userId } });
                await tx.user.delete({ where: { id: userId } });
            }
        });
    }
}

export const employeeRepository = new EmployeeRepository();
