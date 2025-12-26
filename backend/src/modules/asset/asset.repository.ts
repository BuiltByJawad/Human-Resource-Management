import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class AssetRepository {
    async findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.AssetWhereInput;
    }) {
        return prisma.asset.findMany({
            ...params,
            orderBy: { createdAt: 'desc' },
        });
    }

    async count(where?: Prisma.AssetWhereInput) {
        return prisma.asset.count({ where });
    }

    async findById(id: string) {
        return prisma.asset.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.AssetCreateInput) {
        return prisma.asset.create({ data });
    }

    async update(id: string, data: Prisma.AssetUpdateInput) {
        return prisma.asset.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.asset.delete({ where: { id } });
    }

    async findByEmployee(employeeId: string) {
        return prisma.asset.findMany({
            where: {
                assignments: {
                    some: {
                        employeeId,
                        returnedDate: null,
                    },
                },
            },
            include: {
                assignments: {
                    where: { employeeId, returnedDate: null },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const assetRepository = new AssetRepository();
