import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
    async findAll() {
        return prisma.department.findMany({
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

    async findById(id: string) {
        return prisma.department.findFirst({
            where: { id },
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

    async findByName(name: string) {
        return prisma.department.findUnique({
            where: { name },
        });
    }

    async create(data: Prisma.DepartmentCreateInput) {
        return prisma.department.create({
            data: {
                // Spread caller-provided fields (name, description, manager, parentDepartment, ...)
                ...(data as any),
            },
        });
    }

    async update(id: string, data: Prisma.DepartmentUpdateInput) {
        // Existence and workspace ownership are validated in the service layer.
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

    async delete(id: string) {
        const result = await prisma.department.deleteMany({ where: { id } });
        return result.count;
    }

    async count() {
        return prisma.department.count({});
    }
}

export const departmentRepository = new DepartmentRepository();
