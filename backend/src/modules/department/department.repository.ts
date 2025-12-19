import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
    async findAll() {
        return prisma.department.findMany({
            include: {
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        return prisma.department.findUnique({
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
        return prisma.department.create({ data });
    }

    async update(id: string, data: Prisma.DepartmentUpdateInput) {
        return prisma.department.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.department.delete({ where: { id } });
    }

    async count() {
        return prisma.department.count();
    }
}

export const departmentRepository = new DepartmentRepository();
