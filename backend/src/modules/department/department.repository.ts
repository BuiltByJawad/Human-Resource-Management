import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
    async findAll(organizationId: string) {
        return prisma.department.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string, organizationId: string) {
        return prisma.department.findFirst({
            where: { id, organizationId },
            include: {
                employees: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                    },
                },
                _count: {
                    select: { employees: true },
                },
            },
        });
    }

    async findByName(name: string, organizationId: string) {
        return prisma.department.findUnique({
            where: {
                organizationId_name: {
                    organizationId,
                    name,
                },
            },
        });
    }

    async create(data: Prisma.DepartmentCreateInput, organizationId: string) {
        return prisma.department.create({
            data: {
                ...(data as any),
                organizationId,
            },
        });
    }

    async update(id: string, data: Prisma.DepartmentUpdateInput, organizationId: string) {
        const result = await prisma.department.updateMany({
            where: { id, organizationId },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.department.findFirst({
            where: { id, organizationId },
            include: {
                _count: {
                    select: { employees: true },
                },
            },
        });
    }

    async delete(id: string, organizationId: string) {
        const result = await prisma.department.deleteMany({ where: { id, organizationId } });
        return result.count;
    }

    async count(organizationId: string) {
        return prisma.department.count({ where: { organizationId } });
    }
}

export const departmentRepository = new DepartmentRepository();
