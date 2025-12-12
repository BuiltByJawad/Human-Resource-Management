import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class ComplianceRepository {
    async findAll(params: { skip: number; take: number; where?: Prisma.ComplianceLogWhereInput }) {
        return prisma.complianceLog.findMany({
            ...params,
            orderBy: { createdAt: 'desc' },
        });
    }

    async count(where?: Prisma.ComplianceLogWhereInput) {
        return prisma.complianceLog.count({ where });
    }

    async findById(id: string) {
        return prisma.complianceLog.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.ComplianceLogCreateInput) {
        return prisma.complianceLog.create({ data });
    }

    async update(id: string, data: Prisma.ComplianceLogUpdateInput) {
        return prisma.complianceLog.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.complianceLog.delete({ where: { id } });
    }
}

export const complianceRepository = new ComplianceRepository();
