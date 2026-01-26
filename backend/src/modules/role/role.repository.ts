import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class RoleRepository {
    async findAll() {
        return prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { users: true, permissions: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        return prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
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
                    select: { users: true, permissions: true },
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
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { users: true, permissions: true },
                },
            },
        });
    }

    async update(id: string, data: Prisma.RoleUpdateInput) {
        return prisma.role.update({
            where: { id },
            data,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { users: true, permissions: true },
                },
            },
        });
    }

    async syncPermissions(roleId: string, permissionIds: string[]) {
        await prisma.rolePermission.deleteMany({
            where: { roleId },
        });

        if (!permissionIds.length) {
            return;
        }

        await prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
            })),
            skipDuplicates: true,
        });
    }

    async delete(id: string) {
        return prisma.role.delete({
            where: { id },
        });
    }

    async assignToUser(userId: string, roleId: string) {
        const updated = await prisma.user.updateMany({
            where: { id: userId },
            data: {
                roleId,
            },
        });

        if (!updated.count) {
            return null;
        }

        return prisma.user.findUnique({ where: { id: userId } });
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
