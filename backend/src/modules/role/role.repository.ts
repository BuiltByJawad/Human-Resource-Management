import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class RoleRepository {
    async findAll() {
        return prisma.role.findMany({
            include: {
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        return prisma.role.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        employee: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { users: true },
                },
            },
        });
    }

    async findByName(name: string) {
        return prisma.role.findUnique({
            where: { name },
        });
    }

    async create(data: Prisma.RoleCreateInput) {
        return prisma.role.create({
            data,
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
    }

    async update(id: string, data: Prisma.RoleUpdateInput) {
        return prisma.role.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
    }

    async delete(id: string) {
        return prisma.role.delete({
            where: { id },
        });
    }

    async assignToUser(userId: string, roleId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                roleId,
            },
        });
    }

    async getUsersByRole(roleId: string) {
        return prisma.user.findMany({
            where: { roleId },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }
}

export const roleRepository = new RoleRepository();
