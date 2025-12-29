import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
    async findAll(organizationId: string) {
        return prisma.department.findMany({
            where: { organizationId },
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                parentDepartment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        employees: true,
                        subDepartments: true,
                    },
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
                // Spread caller-provided fields (name, description, manager, parentDepartment, ...)
                ...(data as any),
                // Always set the owning organization via relation connect. Prisma's
                // DepartmentCreateInput does not accept the scalar `organizationId`
                // directly here.
                organization: {
                    connect: { id: organizationId },
                },
            },
        });
    }

    async update(id: string, data: Prisma.DepartmentUpdateInput, organizationId: string) {
        // Existence and organization ownership are validated in the service layer.
        // Use `update` here so relational fields (manager, parentDepartment) are supported.
        return prisma.department.update({
            where: { id },
            data,
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                parentDepartment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        employees: true,
                        subDepartments: true,
                    },
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
